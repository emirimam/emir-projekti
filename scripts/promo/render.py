"""
Renderuje promo video kadar po kadar i spaja ga sa zvukom.

  python3 scripts/promo/render.py                 # cijeli video -> public/video/
  python3 scripts/promo/render.py --stills 1 5 8  # samo kadrovi za pregled (PNG)

Treba: playwright (Chromium), ffmpeg, numpy, scipy.
"""
import argparse
import asyncio
import base64
import json
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FONTS = ROOT / "node_modules/@fontsource-variable/bricolage-grotesque/files"
OUT = ROOT / "public/video"
TL = json.loads((HERE / "timeline.json").read_text())


def page_html():
    faces = []
    for name, rng in [
        ("bricolage-grotesque-latin-standard-normal.woff2", "U+0000-00FF,U+2000-206F"),
        ("bricolage-grotesque-latin-ext-standard-normal.woff2", "U+0100-024F,U+1E00-1EFF"),
    ]:
        data = base64.b64encode((FONTS / name).read_bytes()).decode()
        faces.append(
            "@font-face{font-family:B;font-weight:200 800;font-stretch:75% 100%;"
            f"src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{rng}}}"
        )
    return f"""<!doctype html><html><head><meta charset=utf-8><style>{''.join(faces)}
html,body{{margin:0;background:#000}}canvas{{display:block}}</style></head>
<body><canvas id=c></canvas><script>window.TL={json.dumps(TL)};</script>
<script>{(HERE / 'scene.js').read_text()}</script></body></html>"""


async def open_page(pw):
    b = await pw.chromium.launch(args=["--disable-gpu-vsync"])
    pg = await b.new_page(viewport={"width": TL["width"], "height": TL["height"]})
    await pg.set_content(page_html())
    await pg.evaluate(
        "Promise.all([document.fonts.load('700 100px B'), document.fonts.load('600 40px B'), document.fonts.load('500 30px B')])"
    )
    return b, pg


async def stills(times, out_dir):
    async with async_playwright() as pw:
        b, pg = await open_page(pw)
        for t in times:
            await pg.evaluate(f"render({t})")
            await pg.screenshot(path=str(out_dir / f"still_{t:05.2f}.png"))
        await b.close()


async def video(silent_path):
    fps, dur = TL["fps"], TL["duration"]
    frames = int(round(fps * dur))
    ff = subprocess.Popen(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
            "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", str(silent_path),
        ],
        stdin=subprocess.PIPE,
    )
    async with async_playwright() as pw:
        b, pg = await open_page(pw)
        for f in range(frames):
            await pg.evaluate(f"render({f / fps})")
            ff.stdin.write(await pg.screenshot(type="jpeg", quality=93))
            if f % 60 == 0:
                print(f"kadar {f}/{frames}", flush=True)
        await b.close()
    ff.stdin.close()
    ff.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", nargs="*", type=float)
    ap.add_argument("--out", default=str(HERE / "build"))
    a = ap.parse_args()
    build = Path(a.out)
    build.mkdir(parents=True, exist_ok=True)
    if a.stills is not None:
        asyncio.run(stills(a.stills, build))
        return
    silent = build / "silent.mp4"
    asyncio.run(video(silent))
    wav = build / "audio.wav"
    subprocess.run(["python3", str(HERE / "audio.py"), str(wav)], check=True)
    OUT.mkdir(parents=True, exist_ok=True)
    final = OUT / "emir-promo.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(wav),
         "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", str(final)],
        check=True,
    )
    # lakša verzija za mobitel i poster
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(final), "-vf", "scale=1280:-2",
         "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-c:a", "aac", "-b:a", "128k",
         "-movflags", "+faststart", str(OUT / "emir-promo-720.mp4")],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(final), "-vf", "scale=1280:-2",
         "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-row-mt", "1", "-c:a", "libopus", "-b:a", "112k",
         str(OUT / "emir-promo-720.webm")],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(final),
         "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "37", "-row-mt", "1", "-c:a", "libopus", "-b:a", "128k",
         str(OUT / "emir-promo.webm")],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-ss", "9.6", "-i", str(final), "-frames:v", "1",
         "-vf", "scale=1280:-2", "-q:v", "3", str(OUT / "emir-promo.jpg")],
        check=True,
    )
    print("gotovo:", final)


if __name__ == "__main__":
    main()
