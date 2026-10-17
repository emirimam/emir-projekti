/* Promo video za početnu stranicu.
 * Deterministička animacija: render(t) uvijek nacrta isti kadar za isto vrijeme t,
 * pa se video renderuje kadar po kadar (scripts/promo/render.py).
 * Scenarij i tajming su u timeline.json — isti fajl koristi i zvuk (audio.py).
 */
/* global TL */
const W = TL.width;
const H = TL.height;
const cv = document.getElementById('c');
cv.width = W;
cv.height = H;
const ctx = cv.getContext('2d');

/* ---------- pomoćne funkcije ---------- */
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261017);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eout = (x) => 1 - Math.pow(1 - x, 3);
const ein = (x) => x * x * x;
const expo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const back = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`;
const shade = (rgb, k) => rgb.map((v) => clamp(v * k, 0, 255));

const SALT = [226, 236, 242];
const AMBER = hex('#e2a21f');
const TEAL = hex('#2d8a92');

/* ---------- sprite za sjaj ---------- */
function makeGlow(rgb, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, rgba(rgb, 1));
  gr.addColorStop(0.18, rgba(rgb, 0.55));
  gr.addColorStop(0.45, rgba(rgb, 0.12));
  gr.addColorStop(1, rgba(rgb, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}
const glowCache = new Map();
const glow = (rgb) => {
  const k = rgb.join(',');
  if (!glowCache.has(k)) glowCache.set(k, makeGlow(rgb));
  return glowCache.get(k);
};
function drawGlow(x, y, r, rgb, a) {
  if (a <= 0.003 || r <= 0) return;
  ctx.globalAlpha = a;
  ctx.drawImage(glow(rgb), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/* ---------- zrno (grain) ---------- */
const grains = [];
for (let i = 0; i < 6; i++) {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 270;
  const g = c.getContext('2d');
  const img = g.createImageData(480, 270);
  for (let p = 0; p < img.data.length; p += 4) {
    const v = R() * 255;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
    img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grains.push(c);
}

/* ---------- rešetka soli 3×3×3 ---------- */
const S = 150;
const nodes = [];
for (let i = 0; i < 3; i++)
  for (let j = 0; j < 3; j++)
    for (let k = 0; k < 3; k++)
      nodes.push({ x: (i - 1) * S, y: (j - 1) * S, z: (k - 1) * S, big: (i + j + k) % 2 === 0, i, j, k, lit: -1 });
const bonds = [];
nodes.forEach((a, ia) =>
  nodes.forEach((b, ib) => {
    if (ib <= ia) return;
    const d = Math.abs(a.i - b.i) + Math.abs(a.j - b.j) + Math.abs(a.k - b.k);
    if (d === 1) bonds.push([ia, ib, R()]);
  }),
);
// Projekti se pale na velikim ionima (8 uglova + prednja strana), redom koji "skače" po rešetki
const litOrder = [
  [0, 0, 2], [2, 2, 2], [2, 0, 0], [0, 2, 0], [1, 1, 2] , [2, 0, 2], [0, 2, 2], [0, 0, 0], [2, 2, 0],
];
litOrder.forEach(([i, j, k], n) => {
  const node = nodes.find((q) => q.i === i && q.j === j && q.k === k);
  if (node) node.lit = n;
});
// [1,1,2] je mali ion (zbir neparan) — tretiraj ga kao velikog kad je projekat
nodes.forEach((n) => {
  if (n.lit >= 0) n.big = true;
});

/* ---------- čestice ---------- */
const N = 324; // 12 po čvoru
const parts = [];
for (let p = 0; p < N; p++) {
  const depth = 0.35 + R() * 0.65;
  parts.push({
    x: R() * (W + 400) - 200,
    y: R() * (H + 300) - 150,
    vx: (R() - 0.5) * 26 * depth,
    vy: (R() - 0.5) * 18 * depth,
    depth,
    tw: R() * Math.PI * 2,
    node: p % 27,
    ox: (R() - 0.5) * 90,
    oy: (R() - 0.5) * 90,
    oz: (R() - 0.5) * 90,
    delay: R() * 0.9,
  });
}
const dust = [];
for (let p = 0; p < 140; p++)
  dust.push({ x: R() * W, y: R() * H, vx: (R() - 0.5) * 8, vy: -4 - R() * 10, d: 0.2 + R() * 0.8, tw: R() * 6.28 });

/* ---------- kamera i projekcija ---------- */
function camera(t) {
  const pull = eio(prog(t, TL.pullback, TL.pullback + 1.1));
  const back2 = eio(prog(t, TL.collapse[0], TL.collapse[1] - 0.3));
  const cx = lerp(lerp(W / 2, 1360, pull), W / 2, back2);
  const cy = H / 2 + 10;
  const zoom = lerp(lerp(1.0, 0.82, pull), 1.0, back2) * lerp(0.9, 1.0, eout(prog(t, TL.impact, TL.impact + 2.5)));
  const yaw = 0.62 + t * 0.16;
  const pitch = -0.52;
  return { cx, cy, zoom, yaw, pitch };
}
function rot(p, cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;
  return { x: x1, y: y2, z: z2 };
}
const D = 1500;
function proj(r, cam) {
  const f = D / (D + r.z);
  return { x: cam.cx + r.x * f * cam.zoom, y: cam.cy + r.y * f * cam.zoom, f: f * cam.zoom, z: r.z };
}

/* ---------- kocka ---------- */
const FACES = [
  [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]],
  [[-1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, 1]],
  [[-1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, -1, -1]],
  [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
  [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]],
  [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]],
];
const LIGHT = (() => {
  const l = [-0.45, -0.8, -0.4];
  const m = Math.hypot(...l);
  return l.map((v) => v / m);
})();
function drawCube(c, h, cam, fill, edge, edgeA, fillA, spin = 0) {
  const cs = Math.cos(spin), sn = Math.sin(spin);
  const faces = FACES.map((f) => {
    const pts = f.map(([a, b, d]) => {
      const lx = a * h * cs - d * h * sn;
      const lz = a * h * sn + d * h * cs;
      return rot({ x: c.x + lx, y: c.y + b * h, z: c.z + lz }, cam);
    });
    // normala
    const u = [pts[1].x - pts[0].x, pts[1].y - pts[0].y, pts[1].z - pts[0].z];
    const v = [pts[2].x - pts[0].x, pts[2].y - pts[0].y, pts[2].z - pts[0].z];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = Math.hypot(...n) || 1;
    const nn = n.map((q) => q / m);
    const zc = (pts[0].z + pts[2].z) / 2;
    return { pts: pts.map((p) => proj(p, cam)), nn, zc };
  });
  faces
    .filter((f) => f.nn[2] < 0)
    .sort((a, b) => b.zc - a.zc)
    .forEach((f) => {
      const lam = 0.45 + 0.75 * Math.max(0, -(f.nn[0] * LIGHT[0] + f.nn[1] * LIGHT[1] + f.nn[2] * LIGHT[2]));
      ctx.beginPath();
      f.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = rgba(shade(fill, lam), fillA);
      ctx.fill();
      ctx.strokeStyle = rgba(edge, edgeA);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
}

/* ---------- tekst ---------- */
const FONT = 'B, "Bricolage Grotesque", sans-serif';
function text(str, x, y, size, weight, color, alpha = 1, align = 'left', stretch = 'condensed', spacing = 0) {
  if (alpha <= 0.002) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fontStretch = stretch === 'condensed' ? 'semi-condensed' : stretch;
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}
// Otkrivanje teksta kroz masku (linija izlazi odozdo)
function revealLine(str, x, y, size, weight, color, p, out = 0) {
  if (p <= 0) return;
  const lift = (1 - eout(p)) * size * 0.9 + eio(out) * -size * 0.6;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 20, y - size * 1.05, W, size * 1.38);
  ctx.clip();
  text(str, x, y + lift, size, weight, color, clamp(p * 1.4) * (1 - out));
  ctx.restore();
}

/* ---------- glavni render ---------- */
function render(t) {
  const cam = camera(t);
  const imp = TL.impact;

  // kamera "trese" pri udarcima
  const shake = (t0, amp) => {
    const d = t - t0;
    return d > 0 && d < 0.45 ? Math.sin(d * 70) * amp * (1 - d / 0.45) : 0;
  };
  const sx = shake(imp, 9) + shake(TL.final, 7);
  const sy = shake(imp + 0.02, 7) + shake(TL.final + 0.02, 5);

  // pozadina
  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H / 2, W * 0.75);
  const warm = clamp(eout(prog(t, imp - 0.3, imp + 1.5)) * 0.6 - prog(t, 16.5, 18) * 0.2 + expo(prog(t, TL.final, TL.final + 1)) * 0.25);
  bg.addColorStop(0, rgba([26 + warm * 14, 38 + warm * 10, 48], 1));
  bg.addColorStop(0.55, '#111a22');
  bg.addColorStop(1, '#070b0f');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, sx, sy);

  // fina mreža u pozadini (perspektivni pod)
  const gridA = 0.05 * prog(t, 0.2, 2.0) * (1 - prog(t, 21.2, 22));
  if (gridA > 0) {
    ctx.strokeStyle = `rgba(160,190,210,${gridA})`;
    ctx.lineWidth = 1;
    const hor = H * 0.62;
    for (let i = -14; i <= 14; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + i * 22, hor);
      ctx.lineTo(W / 2 + i * 260, H + 40);
      ctx.stroke();
    }
    const scroll = (t * 0.35) % 1;
    for (let r = 0; r < 12; r++) {
      const q = (r + scroll) / 12;
      const y = hor + Math.pow(q, 2.2) * (H - hor + 60);
      ctx.globalAlpha = q;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // prašina u dubini (cijeli video)
  ctx.globalCompositeOperation = 'lighter';
  const dustA = prog(t, 0, 1.2) * (1 - prog(t, 21.3, 22));
  dust.forEach((d) => {
    const x = (((d.x + d.vx * t) % W) + W) % W;
    const y = (((d.y + d.vy * t) % H) + H) % H;
    const a = (0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.7 + d.tw))) * d.d * dustA;
    drawGlow(x, y, 6 + 10 * d.d, SALT, a);
  });

  /* ---- čestice → mreža (plexus) → rešetka ---- */
  const [c0, c1] = TL.converge;
  if (t < imp + 0.25) {
    const pos = parts.map((p) => {
      const fx = p.x + p.vx * t;
      const fy = p.y + p.vy * t;
      const node = nodes[p.node];
      const shrink = 1 - prog(t, c0 + 1.5, c1);
      const tgt = proj(rot({ x: node.x + p.ox * shrink, y: node.y + p.oy * shrink, z: node.z + p.oz * shrink }, cam), cam);
      const e = eio(prog(t, c0 + p.delay, c1 - 0.15 + p.delay * 0.15));
      return { x: lerp(fx, tgt.x, e), y: lerp(fy, tgt.y, e), p, e };
    });
    // linije
    const dmax = lerp(0, 175, eout(prog(t, TL.plexus, c0 + 0.6))) + 40 * eio(prog(t, c0, c1));
    const fadeAll = 1 - prog(t, imp - 0.05, imp + 0.2);
    if (dmax > 2) {
      ctx.lineWidth = 1.1;
      for (let a = 0; a < pos.length; a++) {
        const A = pos[a];
        for (let b = a + 1; b < pos.length; b++) {
          const B = pos[b];
          const dx = A.x - B.x, dy = A.y - B.y;
          if (Math.abs(dx) > dmax || Math.abs(dy) > dmax) continue;
          const d = Math.hypot(dx, dy);
          if (d > dmax) continue;
          const al = (1 - d / dmax) * 0.38 * Math.min(A.p.depth, B.p.depth) * fadeAll * (1 - 0.75 * Math.min(A.e, B.e));
          const warmth = (A.e + B.e) / 2;
          ctx.strokeStyle = rgba([lerp(150, 240, warmth), lerp(200, 190, warmth), lerp(225, 120, warmth)], al);
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
        }
      }
    }
    // tačke
    pos.forEach((q) => {
      const tw = 0.6 + 0.4 * Math.sin(t * 3 + q.p.tw);
      const col = q.e > 0.5 ? [255, 214, 140] : SALT;
      const r = (5 + 9 * q.p.depth) * (1 + q.e * 0.3);
      drawGlow(q.x, q.y, r, col, (0.35 + 0.6 * q.p.depth) * tw * prog(t, 0, 0.8) * fadeAll * (1 - 0.65 * q.e));
    });
  }
  ctx.globalCompositeOperation = 'source-over';

  /* ---- udarni talas i bljesak ---- */
  const wave = (t0, maxR, a0) => {
    const d = prog(t, t0, t0 + 1.1);
    if (d <= 0 || d >= 1) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,220,160,${a0 * (1 - d)})`;
    ctx.lineWidth = 3 + 10 * (1 - d);
    ctx.beginPath();
    ctx.arc(cam.cx, cam.cy, expo(d) * maxR, 0, Math.PI * 2);
    ctx.stroke();
    drawGlow(cam.cx, cam.cy, 200 + expo(d) * 700, [255, 200, 120], (1 - d) * 0.28 * a0);
    ctx.globalCompositeOperation = 'source-over';
  };
  wave(imp, 1300, 0.9);

  /* ---- rešetka ---- */
  const born = back(prog(t, imp - 0.12, imp + 0.55));
  const spacing = 1 - ein(prog(t, TL.collapse[0], TL.collapse[1] - 0.25));
  const latA = clamp(prog(t, imp - 0.12, imp + 0.1)) * (1 - prog(t, TL.collapse[1] - 0.35, TL.collapse[1] - 0.05));
  if (latA > 0) {
    const P = nodes.map((n) => {
      const c = { x: n.x * spacing, y: n.y * spacing, z: n.z * spacing };
      const r = rot(c, cam);
      return { n, c, r, p: proj(r, cam) };
    });
    // veze + energija koja teče kroz njih
    ctx.lineWidth = 1.3;
    bonds.forEach(([a, b, ph]) => {
      const A = P[a].p, B = P[b].p;
      ctx.strokeStyle = `rgba(150,185,210,${0.22 * latA * born})`;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
      const q = (t * 0.55 + ph) % 1;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(lerp(A.x, B.x, q), lerp(A.y, B.y, q), 9, [140, 220, 230], 0.55 * latA * prog(t, imp + 0.4, imp + 1.2));
      ctx.globalCompositeOperation = 'source-over';
    });
    // kocke od najdalje ka najbližoj
    P.sort((a, b) => b.r.z - a.r.z).forEach(({ n, c, p }) => {
      const litAt = n.lit >= 0 ? TL.cubes[n.lit] : Infinity;
      const lp = prog(t, litAt - 0.05, litAt + 0.35);
      const pulse = lp > 0 ? 1 + 0.4 * Math.sin(Math.PI * clamp((t - litAt) / 0.45)) * (t - litAt < 0.45 ? 1 : 0) : 1;
      const base = (n.big ? 0.31 : 0.15) * S * born * pulse * lerp(1, 0.6, 1 - spacing);
      const pr = n.lit >= 0 ? TL.projects[n.lit] : null;
      const col = pr ? hex(pr.color) : SALT;
      if (pr && lp > 0) {
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(p.x, p.y, base * p.f * 3.2, col, 0.55 * lp * latA);
        // prsten pri paljenju
        const rp = prog(t, litAt, litAt + 0.8);
        if (rp > 0 && rp < 1) {
          ctx.strokeStyle = rgba(col, (1 - rp) * 0.8);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, base * p.f * (1.2 + rp * 2.6), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = latA;
      if (pr && lp > 0) {
        drawCube(c, base, cam, col.map((v, i) => lerp(SALT[i] * 0.25, v, lp)), shade(col, 1.3), 0.9, 0.95);
      } else {
        drawCube(c, base, cam, n.big ? [90, 120, 140] : [60, 85, 100], SALT, n.big ? 0.42 : 0.3, n.big ? 0.32 : 0.22);
      }
      ctx.globalAlpha = 1;
    });
  }

  /* ---- uvodni tekst ---- */
  const hookIn = prog(t, 0.5, 1.3), hookOut = prog(t, 2.6, 3.2);
  if (hookIn > 0 && hookOut < 1) {
    const hook = 'Sve počinje jednom tačkom.';
    revealLine(hook, W / 2 - measure(hook, 64, 600) / 2, H / 2 + 20, 64, 600, '#e9f0f4', hookIn, hookOut);
  }

  /* ---- projekti, jedan po jedan ---- */
  const cubeEnd = TL.pullback + 0.3;
  TL.projects.forEach((pr, i) => {
    const t0 = TL.cubes[i];
    const t1 = i < TL.projects.length - 1 ? TL.cubes[i + 1] : cubeEnd;
    const pin = prog(t, t0 + 0.1, t0 + 0.42);
    const pout = prog(t, t1 - 0.12, t1 + 0.08);
    if (pin <= 0 || pout >= 1) return;
    const x = 150;
    revealLine(pr.cat, x, 830, 34, 600, pr.color, pin, pout);
    revealLine(pr.name, x, 935, 92, 700, '#f2f6f8', pin, pout);
  });
  // tačkice napretka (9 projekata)
  const dotsA = prog(t, TL.cubes[0] - 0.2, TL.cubes[0] + 0.2) * (1 - prog(t, cubeEnd, cubeEnd + 0.4));
  if (dotsA > 0) {
    TL.projects.forEach((pr, i) => {
      const on = prog(t, TL.cubes[i], TL.cubes[i] + 0.2);
      const x = 156 + i * 26, y = 985;
      ctx.globalAlpha = dotsA;
      ctx.fillStyle = on > 0 ? rgba(hex(pr.color), 0.35 + 0.65 * on) : 'rgba(200,215,225,0.22)';
      ctx.beginPath();
      ctx.arc(x, y, 5 + 2 * on, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  /* ---- naslov (kinetička tipografija) ---- */
  const hOut = prog(t, 16.4, 16.9);
  TL.headline.forEach((line, i) => {
    const p = prog(t, TL.lines[i], TL.lines[i] + 0.5);
    revealLine(line, 140, 300 + i * 122, 116, 700, '#f2f6f8', p, prog(t, 16.4 + i * 0.06, 16.9 + i * 0.06));
  });
  if (hOut < 1) {
    const bar = eout(prog(t, TL.lines[4] + 0.3, TL.lines[4] + 1.1)) * (1 - hOut);
    if (bar > 0) {
      ctx.fillStyle = rgba(AMBER, 0.9);
      ctx.fillRect(146, 300 + 4 * 122 + 34, 380 * bar, 6);
    }
  }

  /* ---- završetak: logo + potpis ---- */
  const fin = TL.final;
  wave(fin, 900, 0.7);
  const lp = back(prog(t, fin - 0.05, fin + 0.6));
  const endFade = 1 - prog(t, 21.3, 22);
  if (lp > 0) {
    const s = 92 * lp;
    const cx = W / 2, cy = 400;
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(cx, cy + 20, s * 4, AMBER, 0.45 * endFade);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = endFade;
    const top = [[0, -s], [s * 0.866, -s / 2], [0, 0], [-s * 0.866, -s / 2]];
    const left = [[-s * 0.866, -s / 2], [0, 0], [0, s], [-s * 0.866, s / 2]];
    const right = [[s * 0.866, -s / 2], [0, 0], [0, s], [s * 0.866, s / 2]];
    [[top, shade(AMBER, 1.35)], [left, AMBER], [right, shade(AMBER, 0.62)]].forEach(([poly, c]) => {
      ctx.beginPath();
      poly.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, cy + y + 20) : ctx.moveTo(cx + x, cy + y + 20)));
      ctx.closePath();
      ctx.fillStyle = rgba(c, 1);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // mali teal kristal koji orbitira
    const orb = t * 1.4;
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(cx + Math.cos(orb) * 190, cy + 20 + Math.sin(orb) * 60, 26, TEAL, 0.8 * lp * endFade);
    drawGlow(cx + Math.cos(orb + 2.4) * 230, cy + 20 + Math.sin(orb + 2.4) * 70, 18, [132, 103, 166], 0.7 * lp * endFade);
    ctx.globalCompositeOperation = 'source-over';
  }
  const sig = prog(t, fin + 0.25, fin + 0.85);
  if (sig > 0) {
    ctx.save();
    ctx.globalAlpha = endFade;
    revealLine('Emir Imamović', W / 2 - measure('Emir Imamović', 104, 700) / 2, 680, 104, 700, '#f2f6f8', sig);
    ctx.restore();
    const u = prog(t, fin + 0.9, fin + 1.5);
    text(TL.url, W / 2, 752, 36, 600, '#f6c45a', u * endFade, 'center', 'normal', 1);
    const tag = prog(t, fin + 1.3, fin + 1.9);
    text('Aplikacije iz Lukavca, na jednom mjestu.', W / 2, 810, 30, 500, '#a9b6c0', tag * endFade, 'center', 'normal');
  }

  /* ---- vinjeta, zrno, bljesak ---- */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grains[Math.floor(t * TL.fps) % grains.length], 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const flash = Math.max(0, 1 - (t - imp) / 0.22) * (t >= imp ? 0.3 : 0) + Math.max(0, 1 - (t - TL.final) / 0.2) * (t >= TL.final ? 0.22 : 0);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,236,200,${flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  // kratko zatamnjenje na kraju da se petlja glatko nastavi
  const black = prog(t, 21.45, 22) + (1 - prog(t, 0, 0.35));
  if (black > 0) {
    ctx.fillStyle = `rgba(7,11,15,${clamp(black)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
function measure(str, size, weight) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fontStretch = 'semi-condensed';
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}
window.render = render;
