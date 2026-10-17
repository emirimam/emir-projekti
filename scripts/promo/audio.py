"""
Sintetizovan zvuk za promo video, sinhronizovan sa timeline.json.
Sve je generisano kodom (bez tuđih uzoraka), pa nema problema s autorskim pravima.

  python3 scripts/promo/audio.py izlaz.wav
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

HERE = Path(__file__).resolve().parent
TL = json.loads((HERE / "timeline.json").read_text())
SR = 48000
DUR = TL["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(17)
L = np.zeros(N)
Rch = np.zeros(N)


def tt(n):
    return np.arange(n) / SR


def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    lg = np.cos((pan + 1) * np.pi / 4)
    rg = np.sin((pan + 1) * np.pi / 4)
    L[i : i + len(sig)] += sig * lg
    Rch[i : i + len(sig)] += sig * rg


def env(n, a, d, sustain=0.0):
    t = tt(n)
    e = np.minimum(1, t / max(a, 1e-4))
    return e * (sustain + (1 - sustain) * np.exp(-t / d))


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def saw(f, n, phase=0.0):
    ph = np.cumsum(np.full(n, f) / SR) + phase if np.isscalar(f) else np.cumsum(f / SR) + phase
    return 2 * (ph % 1) - 1


A = 55.0  # A1 — ton cijelog videa (a-mol)

# 1) Drone: tamni, široki akord koji se otvara
t = tt(N)
drone = np.zeros(N)
for mult, det, g in [(1, 0.0, 0.5), (1.5, 0.3, 0.32), (2, -0.25, 0.25), (3, 0.4, 0.12)]:
    drone += g * (saw(A * mult + det, N) + saw(A * mult - det * 1.7, N, 0.37)) / 2
cut = 220 + 1600 * np.clip((t - 3) / 3.5, 0, 1) ** 2 * (t < 6.5) + 900 * (t >= 6.5)
# promjenljivi low-pass po blokovima
out = np.zeros(N)
blk = 2400
for s in range(0, N, blk):
    out[s : s + blk] = lp(drone[s : s + blk + 4000], float(np.mean(cut[s : s + blk])))[: len(out[s : s + blk])]
drone_env = np.clip(t / 2.5, 0, 1) * (1 - 0.55 * np.clip((t - 6.5) / 0.3, 0, 1) * (t < 17)) * np.clip((DUR - t) / 2.2, 0, 1)
drone_env = drone_env + 0.35 * np.clip((t - 18.5) / 0.1, 0, 1) * np.exp(-np.clip(t - 18.5, 0, None) / 2.5)
add(out * drone_env, 0, -0.15, 0.32)
add(np.roll(out, 900) * drone_env, 0, 0.15, 0.32)

# 2) Svjetlucanje tačaka (sitni "pling" tonovi u prvih 6 s)
penta = [0, 3, 5, 7, 10]
for i in range(46):
    at = 0.4 + rng.random() * 5.6
    note = A * 16 * 2 ** (penta[rng.integers(5)] / 12) * (2 if rng.random() < 0.3 else 1)
    n = int(SR * 0.6)
    s = np.sin(2 * np.pi * note * tt(n)) * env(n, 0.002, 0.12)
    add(s, at, rng.uniform(-0.8, 0.8), 0.035 + 0.03 * (at / 6))

# 3) Riser: šum koji raste i penje se do udarca
i0, i1 = TL["converge"]
n = int(SR * (i1 - i0))
noise = rng.standard_normal(n)
riser = np.zeros(n)
steps = 40
for k in range(steps):
    a, b = k * n // steps, (k + 1) * n // steps
    f = 400 + 7000 * (k / steps) ** 2
    seg = bp(noise[max(0, a - 2000) : b], f * 0.8, min(f * 1.25, 20000))[-(b - a) :]
    riser[a:b] = seg
rise_env = (tt(n) / (i1 - i0)) ** 2.4
sweep = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (3 * (tt(n) / (i1 - i0)) ** 2)) / SR) * rise_env
add(riser * rise_env, i0, -0.3, 0.55)
add(np.roll(riser, 600) * rise_env, i0, 0.3, 0.55)
add(sweep, i0, 0, 0.12)


def impact(at, size=1.0):
    n = int(SR * 3.5)
    tk = tt(n)
    f = 38 + 120 * np.exp(-tk * 22)
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tk / (0.55 * size))
    crack = hp(rng.standard_normal(n), 1500) * np.exp(-tk / 0.05)
    boom = lp(rng.standard_normal(n), 140) * np.exp(-tk / (1.1 * size)) * 3
    s = kick * 0.9 + crack * 0.35 + boom * 0.5
    add(s, at, 0, 0.9 * size)


impact(TL["impact"], 1.0)

# 4) Ritam 120 BPM od udarca do kraja naslova
beat = 60 / TL["bpm"]
b = TL["impact"] + beat
while b < 16.9:
    n = int(SR * 0.4)
    tk = tt(n)
    k = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-tk * 35)) / SR) * np.exp(-tk / 0.16)
    add(k, b, 0, 0.42)
    # hi-hat na pola takta
    hn = int(SR * 0.08)
    hat = hp(rng.standard_normal(hn), 7000) * np.exp(-tt(hn) / 0.018)
    add(hat, b + beat / 2, 0.25, 0.12)
    b += beat

# 5) Ton za svaku kocku: penje se kroz a-mol pentatoniku
notes = [0, 3, 5, 7, 10, 12, 15, 17, 19]
pans = [-0.6, 0.5, 0.2, -0.3, 0.0, 0.6, -0.5, -0.1, 0.4]
for i, at in enumerate(TL["cubes"]):
    f = A * 8 * 2 ** (notes[i] / 12)
    n = int(SR * 1.6)
    tk = tt(n)
    tone = (np.sin(2 * np.pi * f * tk) + 0.35 * np.sin(2 * np.pi * 2 * f * tk) + 0.12 * np.sin(2 * np.pi * 3.01 * f * tk))
    add(tone * env(n, 0.003, 0.45), at, pans[i], 0.16)
    # mali "whoosh" za pojavu imena
    wn = int(SR * 0.25)
    w = bp(rng.standard_normal(wn), 2500, 6000) * np.sin(np.pi * tt(wn) / 0.25)
    add(w, at + 0.08, -0.6, 0.05)

# 6) Kinetički naslov: duboki "tick" za svaki red
for i, at in enumerate(TL["lines"]):
    n = int(SR * 0.5)
    tk = tt(n)
    s = np.sin(2 * np.pi * (A * 4 * 2 ** ([0, 3, 7, 10, 12][i] / 12)) * tk) * env(n, 0.002, 0.18)
    add(s, at, 0, 0.14)
    wn = int(SR * 0.3)
    add(bp(rng.standard_normal(wn), 800, 3000) * np.sin(np.pi * tt(wn) / 0.3), at - 0.05, 0.4, 0.05)

# 7) Kratki reverse-swell prije završnog udarca
fin = TL["final"]
n = int(SR * 1.2)
sw = lp(rng.standard_normal(n), 3000) * (tt(n) / 1.2) ** 3
add(sw, fin - 1.2, -0.2, 0.35)
add(np.roll(sw, 500), fin - 1.2, 0.2, 0.35)
impact(fin, 1.15)

# 8) Završni akord (Am add9) sa dugim repom
n = int(SR * (DUR - fin))
tk = tt(n)
chord = np.zeros(n)
for semi, g in [(0, 0.5), (7, 0.35), (12, 0.35), (14, 0.25), (15, 0.22), (19, 0.18)]:
    f = A * 4 * 2 ** (semi / 12)
    chord += g * (saw(f + 0.4, n) + saw(f - 0.4, n, 0.5)) / 2
chord = lp(chord, 2400) * np.minimum(1, tk / 0.04) * np.exp(-tk / 2.2)
add(chord, fin, -0.2, 0.32)
add(np.roll(chord, 700), fin, 0.2, 0.32)
# zvonce za URL
for k, at in enumerate([fin + 0.9, fin + 1.3]):
    m = int(SR * 2)
    f = A * 16 * 2 ** ([7, 12][k] / 12)
    add(np.sin(2 * np.pi * f * tt(m)) * env(m, 0.002, 0.7), at, [-0.4, 0.4][k], 0.08)

# --- reverb (jednostavni konvolucijski) ---
ir_n = int(SR * 2.4)
ir = rng.standard_normal(ir_n) * np.exp(-tt(ir_n) / 0.55)
ir = lp(ir, 5000)
ir /= np.sqrt(np.sum(ir**2))
wetL = fftconvolve(L, ir)[:N]
wetR = fftconvolve(Rch, np.roll(ir, 211))[:N]
L2 = L + 0.28 * wetL
R2 = Rch + 0.28 * wetR

# --- master: blaga kompresija i normalizacija ---
mix = np.stack([L2, R2], axis=1)
mix = hp(mix.T, 28).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6)
# utišaj početak/kraj da se petlja ne čuje kao klik
fade = np.ones(N)
fi = int(SR * 0.05)
fo = int(SR * 0.6)
fade[:fi] = np.linspace(0, 1, fi)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]
mix *= 0.89 / np.max(np.abs(mix))
out = sys.argv[1] if len(sys.argv) > 1 else str(HERE / "build/audio.wav")
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("zvuk:", out)
