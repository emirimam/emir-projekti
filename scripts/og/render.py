"""
Generiše slike za dijeljenje (Open Graph) i ikone u public/.
Pokreni ručno kad promijeniš ime ili naslov:  python3 scripts/og/render.py
Treba: pip install playwright (Chromium je već instaliran).
"""
import asyncio
import base64
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "node_modules/@fontsource-variable/bricolage-grotesque/files"
PUBLIC = ROOT / "public"


def font_face():
    css = []
    for name, rng in [
        ("bricolage-grotesque-latin-wght-normal.woff2", "U+0000-00FF,U+2000-206F,U+20AC"),
        ("bricolage-grotesque-latin-ext-wght-normal.woff2", "U+0100-024F,U+1E00-1EFF"),
    ]:
        data = base64.b64encode((FONTS / name).read_bytes()).decode()
        css.append(
            "@font-face{font-family:B;font-weight:200 800;font-stretch:75% 100%;"
            f"src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{rng}}}"
        )
    return "".join(css)


def cube(x, y, s, c, t=None, r=None, o=1):
    t = t or f"color-mix(in oklab,{c} 70%,white)"
    r = r or f"color-mix(in oklab,{c} 65%,black)"
    h = s * 0.5
    w = s * 0.866
    return (
        f'<g transform="translate({x} {y})" opacity="{o}">'
        f'<polygon points="0,{-s} {w},{-h} 0,0 {-w},{-h}" fill="{t}"/>'
        f'<polygon points="{-w},{-h} 0,0 0,{s} {-w},{h}" fill="{c}"/>'
        f'<polygon points="{w},{-h} 0,0 0,{s} {w},{h}" fill="{r}"/>'
        "</g>"
    )


AMBER, TEAL, SLATE, PURPLE = "#e2a21f", "#2d8a92", "#4d6a8a", "#8467a6"

CUBES = "".join(
    [
        cube(170, 150, 34, TEAL, o=0.95),
        cube(300, 110, 22, SLATE, o=0.8),
        cube(250, 250, 70, AMBER),
        cube(120, 300, 26, PURPLE, o=0.9),
        cube(360, 230, 30, TEAL),
        cube(330, 360, 18, AMBER, o=0.6),
    ]
)

OG = """<!doctype html><html><head><meta charset=utf-8><style>{font}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;font-family:B,sans-serif;background:#18232d;color:#eef1f3;
position:relative;overflow:hidden}}
.glow{{position:absolute;inset:0;background:radial-gradient(55% 80% at 88% 10%,rgba(226,162,31,.28),transparent 70%)}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:48px 48px}}
.txt{{position:absolute;left:80px;top:78px;width:700px}}
.name{{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:650;letter-spacing:-.01em}}
.name i{{width:16px;height:16px;background:#e2a21f;transform:rotate(45deg) skew(-8deg,-8deg)}}
h1{{margin-top:44px;font-size:66px;line-height:.98;font-weight:700;letter-spacing:-.035em;font-stretch:85%}}
p{{margin-top:26px;font-size:28px;color:#a9b6c0;line-height:1.3}}
.url{{position:absolute;left:80px;bottom:62px;font-size:24px;color:#e2a21f;font-weight:600;letter-spacing:.01em}}
svg{{position:absolute;right:30px;top:90px;width:470px;height:470px}}
</style></head><body><div class=glow></div><div class=grid></div>
<div class=txt><div class=name><i></i>Emir Imamović</div><h1>{h1}</h1><p>{p}</p></div>
<div class=url>emir-projekti.vercel.app{path}</div>
<svg viewBox="0 0 480 480">{cubes}</svg></body></html>"""

ICON = """<!doctype html><html><head><style>*{{margin:0}}body{{width:{s}px;height:{s}px;background:#18232d;
display:grid;place-items:center}}svg{{width:{i}px;height:{i}px}}</style></head><body>
<svg viewBox="-60 -66 120 132">{c}</svg></body></html>"""

PAGES = {
    "og-bs.png": dict(
        h1="Aplikacije za iznajmljivače, majstore, firme i moj grad.",
        p="Web aplikacije iz Lukavca, na jednom mjestu.",
        path="",
    ),
    "og-en.png": dict(
        h1="Apps for hosts, craftsmen, businesses and my hometown.",
        p="Web apps built in Lukavac, Bosnia, in one place.",
        path="/en/",
    ),
}


async def main():
    font = font_face()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={"width": 1200, "height": 630})
        for out, v in PAGES.items():
            await pg.set_content(OG.format(font=font, cubes=CUBES, **v))
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=str(PUBLIC / out))
        for size, name, pad in [(180, "apple-touch-icon.png", 0.62), (192, "icon-192.png", 0.62), (512, "icon-512.png", 0.56)]:
            p = await b.new_page(viewport={"width": size, "height": size})
            await p.set_content(ICON.format(s=size, i=int(size * pad), c=cube(0, 0, 58, AMBER)))
            await p.screenshot(path=str(PUBLIC / name))
        await b.close()


asyncio.run(main())
