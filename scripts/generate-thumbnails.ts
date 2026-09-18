/**
 * Generates one deterministic SVG thumbnail per project into public/thumbnails/.
 *
 *   npm run thumbs
 *
 * Every thumbnail is 1600x1000 on paper, framed with a hairline, a mono category
 * label and (optionally) one headline metric. The art in the middle is drawn by a
 * motif renderer chosen per project (falling back to the category motif), using a
 * PRNG seeded by the slug so re-running produces identical files. The card overlays
 * the title in real web fonts, so the SVG carries no title.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { categoryById } from "../src/data/categories";
import { projects, type Project } from "../src/data/projects";

const W = 1600;
const H = 1000;
const PAPER = "#FAF8F3";
const INK = "#141416";
const MUTED = "#6B6B70";
const RULE = "#D9D4C9";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, monospace";

// ─────────────────────────── utils ───────────────────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type R = () => number;
const f = (n: number) => Math.round(n * 10) / 10;
const between = (r: R, a: number, b: number) => a + r() * (b - a);
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
function tint(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
function mix(hex: string, towards: string, t: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(towards);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Safe drawing area.
const S = { x0: 90, y0: 150, x1: 1510, y1: 820 };
const SW = S.x1 - S.x0;
const SH = S.y1 - S.y0;
const CX = (S.x0 + S.x1) / 2;
const CY = (S.y0 + S.y1) / 2;

const rect = (x: number, y: number, w: number, h: number, attrs: string) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${attrs}/>`;
const circle = (x: number, y: number, r: number, attrs: string) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${attrs}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, attrs: string) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${attrs}/>`;
const text = (x: number, y: number, s: string, attrs: string) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${MONO}" ${attrs}>${esc(s)}</text>`;
const tag = (x: number, y: number, s: string, bg = INK, fg = PAPER) =>
  rect(x, y - 30, 22 + s.length * 12, 30, `fill="${bg}"`) + text(x + 11, y - 9, s, `font-size="18" fill="${fg}"`);

function faintGrid(step = 40, op = 0.05) {
  let out = "";
  for (let x = S.x0; x <= S.x1; x += step) out += line(x, S.y0, x, S.y1, `stroke="${INK}" stroke-opacity="${op}"`);
  for (let y = S.y0; y <= S.y1; y += step) out += line(S.x0, y, S.x1, y, `stroke="${INK}" stroke-opacity="${op}"`);
  return out;
}

/** Dark inset panel (for telescope / camera / screen imagery). */
function darkPanel(x: number, y: number, w: number, h: number) {
  return rect(x, y, w, h, `rx="10" fill="${INK}"`) + rect(x + 14, y + 14, w - 28, h - 28, `rx="4" fill="none" stroke="${PAPER}" stroke-opacity="0.25" stroke-width="2"`);
}

// ─────────────────────────── motif renderers ───────────────────────────
type Renderer = (r: R, accent: string) => string;

/* ---------- AI / ML ---------- */

const neural: Renderer = (r, accent) => {
  const layers = 4 + Math.floor(r() * 2);
  const cols: { x: number; y: number }[][] = [];
  const gapX = SW / (layers - 1);
  for (let l = 0; l < layers; l++) {
    const n = 3 + Math.floor(r() * 5);
    const col: { x: number; y: number }[] = [];
    const span = Math.min(SH, n * 110);
    const top = CY - span / 2;
    for (let i = 0; i < n; i++)
      col.push({ x: S.x0 + l * gapX + between(r, -30, 30), y: top + (n === 1 ? span / 2 : (i * span) / (n - 1)) + between(r, -18, 18) });
    cols.push(col);
  }
  let out = "";
  for (let l = 0; l < layers - 1; l++)
    for (const a of cols[l])
      for (const b of cols[l + 1]) {
        if (r() < 0.35) continue;
        const w = between(r, 0.6, 3.2);
        const strong = w > 2.4;
        const cx = (a.x + b.x) / 2 + between(r, -40, 40);
        out += `<path d="M${f(a.x)} ${f(a.y)} C ${f(cx)} ${f(a.y)}, ${f(cx)} ${f(b.y)}, ${f(b.x)} ${f(b.y)}" stroke="${strong ? accent : INK}" stroke-opacity="${strong ? 0.75 : 0.18}" stroke-width="${f(w)}" fill="none"/>`;
      }
  for (const col of cols)
    for (const p of col) {
      const hot = r() < 0.28;
      const rad = hot ? between(r, 16, 24) : between(r, 9, 15);
      out += circle(p.x, p.y, rad, `fill="${hot ? accent : PAPER}" stroke="${hot ? accent : INK}" stroke-width="${hot ? 0 : 2.5}"`);
      if (hot) out += circle(p.x, p.y, rad + 12, `fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"`);
    }
  return out;
};

/** Star field with a faint object drifting across a sequence of frames (TNO detection). */
const galaxy: Renderer = (r, accent) => {
  let out = darkPanel(S.x0, S.y0, SW, SH);
  // nebula glow
  out += `<defs><radialGradient id="neb" cx="0.35" cy="0.45" r="0.6"><stop offset="0" stop-color="${accent}" stop-opacity="0.45"/><stop offset="0.5" stop-color="${accent}" stop-opacity="0.12"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>`;
  out += rect(S.x0 + 14, S.y0 + 14, SW - 28, SH - 28, `rx="4" fill="url(#neb)"`);
  // spiral galaxy, lower right
  const gx = S.x0 + SW * 0.72;
  const gy = S.y0 + SH * 0.62;
  for (let arm = 0; arm < 2; arm++) {
    let d = "";
    for (let t = 0; t < 5.2; t += 0.08) {
      const rad = 14 + t * 34;
      const a = t * 1.15 + arm * Math.PI;
      const x = gx + Math.cos(a) * rad * 1.35;
      const y = gy + Math.sin(a) * rad * 0.6;
      d += (d ? " L" : "M") + `${f(x)} ${f(y)}`;
    }
    out += `<path d="${d}" fill="none" stroke="${PAPER}" stroke-opacity="0.35" stroke-width="14" stroke-linecap="round"/>`;
    out += `<path d="${d}" fill="none" stroke="${PAPER}" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/>`;
  }
  out += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="46" ry="22" fill="${PAPER}" fill-opacity="0.9"/>`;
  // stars
  for (let i = 0; i < 260; i++) {
    const x = between(r, S.x0 + 20, S.x1 - 20);
    const y = between(r, S.y0 + 20, S.y1 - 20);
    const rad = r() < 0.08 ? between(r, 2.2, 3.6) : between(r, 0.6, 1.8);
    out += circle(x, y, rad, `fill="${PAPER}" fill-opacity="${f(between(r, 0.4, 1))}"`);
    if (rad > 3) out += line(x - 9, y, x + 9, y, `stroke="${PAPER}" stroke-opacity="0.6" stroke-width="1"`) + line(x, y - 9, x, y + 9, `stroke="${PAPER}" stroke-opacity="0.6" stroke-width="1"`);
  }
  // the moving object: 5 frames along a track, boxed
  const x0 = S.x0 + SW * 0.18;
  const y0 = S.y0 + SH * 0.34;
  for (let k = 0; k < 5; k++) {
    const x = x0 + k * 92;
    const y = y0 + k * 26;
    out += circle(x, y, 4.5, `fill="${accent}"`);
    out += rect(x - 26, y - 26, 52, 52, `fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="6 5"`);
    out += text(x - 26, y - 34, `t${k}`, `font-size="16" fill="${accent}"`);
  }
  out += line(x0 - 40, y0 - 11, x0 + 4 * 92 + 40, y0 + 4 * 26 + 11, `stroke="${accent}" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="2 8"`);
  return out;
};

/** Scatter with a separating hyperplane and margins (SVM). */
const svm: Renderer = (r, accent) => {
  let out = faintGrid(50, 0.06);
  const ang = -0.55;
  const nx = Math.cos(ang), ny = Math.sin(ang);
  for (let i = 0; i < 90; i++) {
    const x = between(r, S.x0 + 40, S.x1 - 40);
    const y = between(r, S.y0 + 40, S.y1 - 40);
    const side = (x - CX) * nx + (y - CY) * ny;
    if (Math.abs(side) < 40) continue;
    const pos = side > 0;
    out += pos
      ? circle(x, y, 9, `fill="${accent}" fill-opacity="0.85"`)
      : rect(x - 8, y - 8, 16, 16, `fill="none" stroke="${INK}" stroke-width="2.5" transform="rotate(45 ${f(x)} ${f(y)})"`);
  }
  const L = 900;
  const dx = -ny * L, dy = nx * L;
  for (const [off, w, dash] of [[0, 4, ""], [70, 2, "14 10"], [-70, 2, "14 10"]] as const) {
    const ox = CX + nx * off, oy = CY + ny * off;
    out += line(ox - dx, oy - dy, ox + dx, oy + dy, `stroke="${INK}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""}`);
  }
  out += tag(S.x0 + 20, S.y0 + 50, "w·x + b = 0");
  return out;
};

/** Decision tree diagram. */
const tree: Renderer = (r, accent) => {
  let out = "";
  const draw = (x: number, y: number, depth: number, spread: number): string => {
    let s = "";
    const leaf = depth >= 3 || (depth >= 2 && r() < 0.4);
    if (!leaf) {
      const cy = y + 150;
      for (const dir of [-1, 1]) {
        const cx = x + dir * spread;
        s += `<path d="M${f(x)} ${f(y + 24)} C ${f(x)} ${f(y + 90)}, ${f(cx)} ${f(cy - 90)}, ${f(cx)} ${f(cy - 24)}" fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="2.5"/>`;
        s += draw(cx, cy, depth + 1, spread / 2.1);
      }
      s += rect(x - 64, y - 24, 128, 48, `rx="8" fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
      s += line(x - 40, y, x + 40, y, `stroke="${INK}" stroke-opacity="0.35" stroke-width="6" stroke-linecap="round"`);
    } else {
      const good = r() < 0.55;
      s += circle(x, y, 24, `fill="${good ? accent : INK}" fill-opacity="${good ? 0.9 : 0.75}"`);
    }
    return s;
  };
  out += draw(CX, S.y0 + 40, 0, 360);
  return out;
};

/** Transactions scatter with anomalies ringed (fraud). */
const outliers: Renderer = (r, accent) => {
  let out = faintGrid(60, 0.05);
  // card
  out += rect(S.x0 + 20, S.y0 + 20, 300, 190, `rx="18" fill="${INK}"`);
  out += rect(S.x0 + 20, S.y0 + 62, 300, 34, `fill="${PAPER}" fill-opacity="0.85"`);
  out += rect(S.x0 + 46, S.y0 + 130, 150, 14, `rx="7" fill="${PAPER}" fill-opacity="0.6"`);
  out += circle(S.x0 + 270, S.y0 + 165, 20, `fill="${accent}"`) + circle(S.x0 + 245, S.y0 + 165, 20, `fill="${PAPER}" fill-opacity="0.7"`);
  // dense cluster
  for (let i = 0; i < 220; i++) {
    const x = CX + 150 + between(r, -1, 1) * between(r, 0, 380);
    const y = CY + 60 + between(r, -1, 1) * between(r, 0, 220);
    out += circle(x, y, between(r, 3, 6), `fill="${INK}" fill-opacity="${f(between(r, 0.15, 0.5))}"`);
  }
  for (let i = 0; i < 6; i++) {
    const x = between(r, S.x0 + 400, S.x1 - 40);
    const y = between(r, S.y0 + 30, S.y0 + 200);
    out += circle(x, y, 7, `fill="${accent}"`);
    out += circle(x, y, 22, `fill="none" stroke="${accent}" stroke-width="3"`);
    out += text(x + 30, y + 6, "fraud", `font-size="18" fill="${accent}"`);
  }
  return out;
};

/** Unrolled recurrent cells over a token sequence (RNN / LSTM). */
const sequence: Renderer = (r, accent) => {
  let out = "";
  const n = 7;
  const gap = SW / n;
  const y = CY;
  for (let i = 0; i < n; i++) {
    const x = S.x0 + gap * i + gap / 2;
    // token below
    const tw = between(r, 70, 130);
    out += rect(x - tw / 2, y + 150, tw, 24, `rx="12" fill="${INK}" fill-opacity="0.2"`);
    out += line(x, y + 150, x, y + 46, `stroke="${INK}" stroke-opacity="0.5" stroke-width="2.5" marker-end="url(#arr)"`);
    // cell
    out += rect(x - 56, y - 46, 112, 92, `rx="14" fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
    out += circle(x - 20, y, 10, `fill="none" stroke="${INK}" stroke-width="2"`) + circle(x + 20, y, 10, `fill="none" stroke="${INK}" stroke-width="2"`);
    out += line(x - 10, y, x + 10, y, `stroke="${INK}" stroke-width="2"`);
    if (i < n - 1) out += line(x + 56, y - 14, x + gap - 56, y - 14, `stroke="${accent}" stroke-width="4"`) + line(x + 56, y + 14, x + gap - 56, y + 14, `stroke="${INK}" stroke-opacity="0.4" stroke-width="2"`);
    // sentiment output
    const pos = r() < 0.5;
    out += line(x, y - 46, x, y - 120, `stroke="${INK}" stroke-opacity="0.5" stroke-width="2.5"`);
    out += circle(x, y - 140, 18, `fill="${pos ? accent : INK}" fill-opacity="${pos ? 0.9 : 0.35}"`);
    out += text(x - 6, y - 133, pos ? "+" : "−", `font-size="22" fill="${PAPER}"`);
  }
  out += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="${INK}" fill-opacity="0.5"/></marker></defs>`;
  return out;
};

/** Sparse user × item matrix with factorization bars (recommender). */
const matrix: Renderer = (r, accent) => {
  let out = "";
  const cols = 22, rows = 11;
  const cw = (SW - 260) / cols, ch = (SH - 60) / rows;
  const ox = S.x0 + 220, oy = S.y0 + 60;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const v = r();
      if (v < 0.55) continue;
      const hot = v > 0.9;
      out += rect(ox + i * cw + 3, oy + j * ch + 3, cw - 6, ch - 6, `rx="4" fill="${hot ? accent : INK}" fill-opacity="${hot ? 0.9 : f(0.15 + (v - 0.55) * 1.2)}"`);
    }
  // user factor column + item factor row
  for (let j = 0; j < rows; j++) out += rect(S.x0 + 40, oy + j * ch + 3, between(r, 40, 150), ch - 6, `rx="3" fill="${accent}" fill-opacity="0.6"`);
  for (let i = 0; i < cols; i++) out += rect(ox + i * cw + 3, S.y0 + between(r, 8, 40), cw - 6, 12, `rx="3" fill="${INK}" fill-opacity="0.4"`);
  out += text(S.x0 + 40, S.y0 + 40, "users", `font-size="18" fill="${MUTED}"`);
  out += text(ox, S.y1 - 4, "items", `font-size="18" fill="${MUTED}"`);
  return out;
};

/** Mel spectrogram columns and a waveform (audio). */
const spectrogram: Renderer = (r, accent) => {
  let out = "";
  const cols = 64, rows = 24;
  const cw = SW / cols, ch = (SH - 160) / rows;
  for (let i = 0; i < cols; i++) {
    const beat = Math.sin(i * 0.5) * 0.5 + 0.5;
    for (let j = 0; j < rows; j++) {
      const v = Math.max(0, beat * (1 - j / rows) + between(r, -0.25, 0.25)) * (0.5 + 0.5 * Math.sin(i * 0.17 + j * 0.9));
      if (v < 0.08) continue;
      out += rect(S.x0 + i * cw + 1, S.y0 + (rows - 1 - j) * ch + 1, cw - 2, ch - 2, `fill="${v > 0.55 ? accent : INK}" fill-opacity="${f(Math.min(1, v * 1.3))}"`);
    }
  }
  let d = "";
  for (let x = S.x0; x <= S.x1; x += 4) {
    const t = (x - S.x0) / 60;
    const y = S.y1 - 60 + Math.sin(t * 3.1) * 28 * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.7))) + between(r, -4, 4);
    d += (d ? " L" : "M") + `${x} ${f(y)}`;
  }
  out += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  return out;
};

/** Motor cross-section with a fault spectrum (induction motor). */
const motor: Renderer = (r, accent) => {
  let out = "";
  const mx = S.x0 + 360, my = CY;
  out += circle(mx, my, 250, `fill="${PAPER}" stroke="${INK}" stroke-width="5"`);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    out += line(mx + Math.cos(a) * 205, my + Math.sin(a) * 205, mx + Math.cos(a) * 248, my + Math.sin(a) * 248, `stroke="${INK}" stroke-width="10" stroke-opacity="0.75"`);
  }
  out += circle(mx, my, 200, `fill="none" stroke="${INK}" stroke-width="3"`);
  out += circle(mx, my, 150, `fill="${INK}" fill-opacity="0.08" stroke="${INK}" stroke-width="3"`);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const broken = i === 5 || i === 6;
    out += line(mx + Math.cos(a) * 60, my + Math.sin(a) * 60, mx + Math.cos(a) * 140, my + Math.sin(a) * 140, `stroke="${broken ? accent : INK}" stroke-width="${broken ? 9 : 7}" ${broken ? 'stroke-dasharray="14 10"' : ""}`);
  }
  out += circle(mx, my, 42, `fill="${INK}"`);
  // spectrum on the right
  const sx = S.x0 + 700, sw = S.x1 - sx, base = S.y1 - 40;
  out += line(sx, base, S.x1, base, `stroke="${INK}" stroke-width="2"`);
  for (let i = 0; i < 60; i++) {
    const x = sx + (i / 60) * sw;
    let h = between(r, 10, 60);
    const peak = i === 12 || i === 24 || i === 36;
    if (peak) h = i === 24 ? 360 : 200;
    out += rect(x, base - h, sw / 60 - 4, h, `fill="${peak && i !== 24 ? accent : INK}" fill-opacity="${peak ? 0.9 : 0.3}"`);
  }
  out += text(sx + (36 / 60) * sw - 60, base - 215, "fault sideband", `font-size="18" fill="${accent}"`);
  return out;
};

/** Grid of small image tiles with one highlighted class (image classification). */
const mosaic: Renderer = (r, accent) => {
  let out = "";
  const cols = 12, rows = 6;
  const cw = SW / cols, ch = SH / rows;
  const hues = [accent, mix(accent, INK, 0.4), mix(accent, PAPER, 0.5), "#7A5C1E", "#4E6B2F", "#5B4B8A", "#1F4E79"];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = S.x0 + i * cw + 6, y = S.y0 + j * ch + 6;
      const c = hues[Math.floor(r() * hues.length)];
      out += rect(x, y, cw - 12, ch - 12, `rx="6" fill="${c}" fill-opacity="${f(between(r, 0.18, 0.5))}"`);
      // a blob inside as the "object"
      out += `<ellipse cx="${f(x + cw / 2 - 6 + between(r, -14, 14))}" cy="${f(y + ch / 2 - 6)}" rx="${f(between(r, 18, 40))}" ry="${f(between(r, 14, 32))}" fill="${c}" fill-opacity="0.6"/>`;
      if (r() < 0.08) {
        out += rect(x - 2, y - 2, cw - 8, ch - 8, `rx="7" fill="none" stroke="${INK}" stroke-width="3.5"`);
        out += tag(x + 4, y + ch - 20, `${(0.87 + r() * 0.12).toFixed(2)}`);
      }
    }
  return out;
};

/** Dermoscopic lesion with ensemble votes (skin cancer). */
const lesion: Renderer = (r, accent) => {
  let out = "";
  const lx = S.x0 + 380, ly = CY;
  out += circle(lx, ly, 290, `fill="${mix(accent, PAPER, 0.85)}" stroke="${INK}" stroke-width="4"`);
  out += circle(lx, ly, 290, `fill="none" stroke="${INK}" stroke-opacity="0.2" stroke-width="30"`);
  let d = "";
  const pts = 14;
  for (let k = 0; k < pts; k++) {
    const a = (k / pts) * Math.PI * 2;
    const rad = 120 * between(r, 0.7, 1.25);
    d += (k ? "L" : "M") + `${f(lx + Math.cos(a) * rad)} ${f(ly + Math.sin(a) * rad * 0.85)} `;
  }
  out += `<path d="${d}Z" fill="${mix(accent, INK, 0.35)}" fill-opacity="0.75" stroke="${INK}" stroke-width="2"/>`;
  for (let i = 0; i < 26; i++) out += circle(lx + between(r, -90, 90), ly + between(r, -70, 70), between(r, 3, 9), `fill="${INK}" fill-opacity="0.35"`);
  out += line(lx - 300, ly, lx + 300, ly, `stroke="${INK}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 8"`) + line(lx, ly - 300, lx, ly + 300, `stroke="${INK}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 8"`);
  // model votes
  const models = ["XGBoost", "LightGBM", "AdaBoost", "SVM", "LogReg"];
  const bx = S.x0 + 780;
  models.forEach((m, i) => {
    const y = S.y0 + 90 + i * 110;
    const w = between(r, 300, 620);
    out += text(bx, y - 14, m, `font-size="20" fill="${MUTED}"`);
    out += rect(bx, y, 640, 26, `rx="13" fill="${INK}" fill-opacity="0.08"`);
    out += rect(bx, y, w, 26, `rx="13" fill="${i === 0 ? accent : INK}" fill-opacity="${i === 0 ? 0.9 : 0.45}"`);
  });
  return out;
};

/** Bins with sorted-item icons and a classifier bar (waste classification). */
const bins: Renderer = (r, accent) => {
  let out = "";
  const names = ["cardboard", "glass", "metal", "paper", "plastic", "trash"];
  const n = names.length;
  const gap = SW / n;
  names.forEach((name, i) => {
    const x = S.x0 + gap * i + gap / 2;
    const y = S.y1 - 80;
    const hot = i === 2;
    // bin
    out += `<path d="M${f(x - 90)} ${f(y - 260)} L${f(x - 70)} ${f(y)} L${f(x + 70)} ${f(y)} L${f(x + 90)} ${f(y - 260)} Z" fill="${hot ? accent : PAPER}" fill-opacity="${hot ? 0.85 : 1}" stroke="${INK}" stroke-width="3.5"/>`;
    out += rect(x - 104, y - 292, 208, 32, `rx="6" fill="${hot ? accent : PAPER}" stroke="${INK}" stroke-width="3.5"`);
    out += text(x - name.length * 5.5, y + 40, name, `font-size="18" letter-spacing="2" fill="${hot ? accent : MUTED}"`);
    // items inside
    for (let k = 0; k < 3; k++) out += rect(x - 40 + k * 30, y - 220 + between(r, 0, 120), 22, between(r, 24, 60), `rx="4" fill="${INK}" fill-opacity="${hot ? 0.6 : 0.2}"`);
  });
  // item + prediction at top
  out += rect(S.x0 + 40, S.y0 + 10, 200, 150, `rx="10" fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
  out += `<path d="M${S.x0 + 90} ${S.y0 + 130} L${S.x0 + 120} ${S.y0 + 60} L${S.x0 + 160} ${S.y0 + 100} L${S.x0 + 200} ${S.y0 + 40} L${S.x0 + 210} ${S.y0 + 130} Z" fill="${INK}" fill-opacity="0.25"/>`;
  out += `<path d="M${S.x0 + 250} ${S.y0 + 85} C ${S.x0 + 500} ${S.y0 + 85}, ${S.x0 + 500} ${S.y0 + 250}, ${f(S.x0 + gap * 2.5)} ${S.y0 + 300}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  out += tag(S.x0 + 260, S.y0 + 70, "metal 0.93", accent, PAPER);
  return out;
};

/* ---------- Computer vision ---------- */

const segmentation: Renderer = (r, accent) => {
  let out = faintGrid();
  const palette = [accent, mix(accent, "#FFFFFF", 0.45), mix(accent, INK, 0.35), "#7A5C1E", "#4E6B2F"];
  const blobs = 5 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const cx = between(r, S.x0 + 150, S.x1 - 150);
    const cy = between(r, S.y0 + 120, S.y1 - 120);
    const rx = between(r, 110, 260), ry = between(r, 80, 190);
    const pts = 9 + Math.floor(r() * 5);
    let d = "";
    for (let k = 0; k < pts; k++) {
      const ang = (k / pts) * Math.PI * 2;
      const wob = between(r, 0.72, 1.18);
      d += (k === 0 ? "M" : "L") + `${f(cx + Math.cos(ang) * rx * wob)} ${f(cy + Math.sin(ang) * ry * wob)} `;
    }
    const col = palette[i % palette.length];
    out += `<path d="${d}Z" fill="${col}" fill-opacity="${f(between(r, 0.28, 0.55))}" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  for (let i = 0; i < 2; i++) {
    const x = between(r, S.x0 + 40, S.x1 - 420), y = between(r, S.y0 + 40, S.y1 - 280);
    const w = between(r, 240, 380), h = between(r, 160, 240);
    out += rect(x, y, w, h, `fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="14 10"`);
    out += tag(x, y - 4, `obj ${(0.86 + r() * 0.13).toFixed(2)}`);
  }
  return out;
};

/** Perspective road scene painted as class regions (driving segmentation). */
const roadscene: Renderer = (r, accent) => {
  let out = "";
  const sky = mix(accent, PAPER, 0.75), road = mix(INK, PAPER, 0.55), veg = "#4E6B2F", bld = mix(accent, INK, 0.3), car = accent, ped = "#B8412B";
  const hz = S.y0 + SH * 0.42;
  out += rect(S.x0, S.y0, SW, hz - S.y0, `fill="${sky}"`);
  out += rect(S.x0, hz, SW, S.y1 - hz, `fill="${veg}" fill-opacity="0.45"`);
  // buildings
  for (let i = 0; i < 9; i++) {
    const w = between(r, 60, 150), h = between(r, 60, 220);
    const x = S.x0 + (i / 9) * SW + between(r, 0, 40);
    out += rect(x, hz - h, w, h, `fill="${bld}" fill-opacity="${f(between(r, 0.5, 0.85))}"`);
  }
  // road trapezoid
  out += `<path d="M${S.x0} ${S.y1} L${f(CX - 90)} ${f(hz)} L${f(CX + 90)} ${f(hz)} L${S.x1} ${S.y1} Z" fill="${road}"/>`;
  for (let k = 0; k < 7; k++) {
    const t0 = k / 7, t1 = (k + 0.5) / 7;
    const y0 = hz + (S.y1 - hz) * t0 ** 1.6, y1 = hz + (S.y1 - hz) * t1 ** 1.6;
    out += rect(CX - 4, y0, 8, Math.max(4, y1 - y0), `fill="${PAPER}" fill-opacity="0.8"`);
  }
  // cars
  for (const [t, side] of [[0.35, -1], [0.62, 1], [0.8, -1]] as const) {
    const y = hz + (S.y1 - hz) * t;
    const sc = 0.35 + t;
    const x = CX + side * (60 + 260 * t);
    out += rect(x - 70 * sc, y - 60 * sc, 140 * sc, 60 * sc, `rx="${8 * sc}" fill="${car}"`);
    out += rect(x - 45 * sc, y - 95 * sc, 90 * sc, 40 * sc, `rx="${8 * sc}" fill="${car}"`);
  }
  // pedestrian
  out += circle(S.x0 + 200, S.y1 - 210, 16, `fill="${ped}"`) + rect(S.x0 + 188, S.y1 - 194, 24, 70, `rx="8" fill="${ped}"`);
  // legend
  const legend: [string, string][] = [["road", road], ["vehicle", car], ["pedestrian", ped], ["building", bld], ["vegetation", veg]];
  legend.forEach(([n, c], i) => {
    const x = S.x0 + 24 + i * 210;
    out += rect(x, S.y0 + 20, 22, 22, `rx="4" fill="${c}"`);
    out += text(x + 32, S.y0 + 38, n, `font-size="18" fill="${INK}"`);
  });
  return out;
};

/** Woven fabric with a defect region and fused detection boxes. */
const fabric: Renderer = (r, accent) => {
  let out = "";
  const step = 14;
  for (let x = S.x0; x < S.x1; x += step) out += line(x + step / 2, S.y0, x + step / 2, S.y1, `stroke="${INK}" stroke-opacity="0.18" stroke-width="${step * 0.55}"`);
  for (let y = S.y0; y < S.y1; y += step) out += line(S.x0, y + step / 2, S.x1, y + step / 2, `stroke="${INK}" stroke-opacity="0.12" stroke-width="${step * 0.55}"`);
  // defect: a tear / stain
  const dx = S.x0 + SW * 0.62, dy = S.y0 + SH * 0.5;
  out += `<path d="M${f(dx - 120)} ${f(dy - 30)} C ${f(dx - 40)} ${f(dy - 90)}, ${f(dx + 60)} ${f(dy + 10)}, ${f(dx + 140)} ${f(dy - 40)} C ${f(dx + 90)} ${f(dy + 40)}, ${f(dx - 20)} ${f(dy + 90)}, ${f(dx - 120)} ${f(dy + 30)} Z" fill="${PAPER}" stroke="${accent}" stroke-width="3"/>`;
  for (let i = 0; i < 18; i++) {
    const x = dx + between(r, -110, 130), y = dy + between(r, -30, 30);
    out += line(x, y - between(r, 6, 20), x + between(r, -8, 8), y + between(r, 6, 20), `stroke="${accent}" stroke-width="2"`);
  }
  // detector boxes (from several methods) + fused box
  const names = ["GLCM", "FFT", "Gabor", "Hough"];
  names.forEach((n, i) => {
    const x = dx - 150 + between(r, -30, 30), y = dy - 70 + between(r, -30, 30);
    const w = 300 + between(r, -40, 60), h = 150 + between(r, -30, 40);
    out += rect(x, y, w, h, `fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="8 6"`);
    out += text(x + 8, y - 8 - i * 0, n, `font-size="15" fill="${MUTED}"`);
  });
  out += rect(dx - 160, dy - 80, 330, 165, `fill="none" stroke="${accent}" stroke-width="5"`);
  out += tag(dx - 160, dy - 86, "defect · IoU fused", accent, PAPER);
  return out;
};

/** Fundus circle with branching vessels (retina). */
const retina: Renderer = (r, accent) => {
  let out = "";
  const cx = CX, cy = CY, R0 = 320;
  out += circle(cx, cy, R0, `fill="${mix(accent, PAPER, 0.8)}" stroke="${INK}" stroke-width="4"`);
  out += circle(cx + 110, cy - 20, 60, `fill="${PAPER}" stroke="${INK}" stroke-opacity="0.4" stroke-width="2"`);
  const branch = (x: number, y: number, a: number, len: number, w: number, depth: number): string => {
    if (depth > 5 || len < 12) return "";
    const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
    if (Math.hypot(nx - cx, ny - cy) > R0 - 10) return "";
    let s = `<path d="M${f(x)} ${f(y)} Q ${f(x + Math.cos(a + 0.4) * len * 0.5)} ${f(y + Math.sin(a + 0.4) * len * 0.5)} ${f(nx)} ${f(ny)}" fill="none" stroke="${depth < 2 ? accent : mix(accent, INK, 0.3)}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
    s += branch(nx, ny, a + between(r, -0.7, -0.1), len * between(r, 0.65, 0.9), w * 0.7, depth + 1);
    s += branch(nx, ny, a + between(r, 0.1, 0.7), len * between(r, 0.65, 0.9), w * 0.7, depth + 1);
    return s;
  };
  for (const a of [0.5, 2.6, -0.5, -2.6, 1.6, -1.6]) out += branch(cx + 110, cy - 20, a, 120, 9, 0);
  // segmentation mask inset
  out += rect(S.x1 - 330, S.y0 + 20, 300, 200, `rx="10" fill="${INK}"`);
  for (let i = 0; i < 40; i++) {
    const x = S.x1 - 300 + between(r, 0, 240), y = S.y0 + 40 + between(r, 0, 160);
    out += line(x, y, x + between(r, -40, 40), y + between(r, -30, 30), `stroke="${PAPER}" stroke-width="${f(between(r, 1, 4))}" stroke-linecap="round"`);
  }
  out += text(S.x1 - 320, S.y0 + 250, "PREDICTED MASK", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  return out;
};

/** Two camera frames with disparity bands and a depth map (stereo). */
const stereo: Renderer = (r, accent) => {
  let out = "";
  const fw = 560, fh = 380;
  const lx = S.x0 + 40, rx = S.x0 + 300, fy = S.y0 + 40;
  for (const [x, label] of [[rx, "R"], [lx, "L"]] as const) {
    out += rect(x, fy, fw, fh, `rx="10" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"`);
    out += text(x + 14, fy + 30, label, `font-size="22" fill="${INK}"`);
  }
  // objects seen in both with a horizontal shift
  const objs = [[200, 120, 80, 40], [330, 200, 60, 110], [120, 250, 140, 20]] as const;
  objs.forEach(([ox, oy, w, dsp], i) => {
    const c = i === 1 ? accent : INK;
    out += rect(lx + ox, fy + oy, w, w * 0.8, `rx="8" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="2"`);
    out += rect(rx + ox - dsp, fy + oy, w, w * 0.8, `rx="8" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="2"`);
    out += line(lx + ox + w, fy + oy + w * 0.4, rx + ox - dsp, fy + oy + w * 0.4, `stroke="${c}" stroke-width="1.5" stroke-dasharray="4 6"`);
  });
  // depth map
  const dx = S.x0 + 940, dy = S.y0 + 40, dw = 480, dh = 640;
  out += rect(dx, dy, dw, dh, `rx="10" fill="${INK}"`);
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 12; i++) {
      const depth = Math.min(1, Math.hypot(i - 7, j - 6) / 9 + between(r, -0.08, 0.08));
      out += rect(dx + 10 + i * 38, dy + 10 + j * 39, 36, 37, `fill="${accent}" fill-opacity="${f(1 - depth)}"`);
    }
  out += text(dx, dy + dh + 30, "DISPARITY → DEPTH", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  return out;
};

/** Top-down lanes with detected vehicles and a counting line (traffic). */
const traffic: Renderer = (r, accent) => {
  let out = rect(S.x0, S.y0, SW, SH, `fill="${mix(INK, PAPER, 0.6)}"`);
  const lanes = 4;
  for (let l = 0; l <= lanes; l++) {
    const x = S.x0 + (SW / lanes) * l;
    for (let y = S.y0; y < S.y1; y += 60) out += rect(x - 3, y, 6, 34, `fill="${PAPER}" fill-opacity="${l === 0 || l === lanes ? 0.9 : 0.6}"`);
  }
  const ly = CY + 40;
  out += line(S.x0, ly, S.x1, ly, `stroke="${accent}" stroke-width="5" stroke-dasharray="20 12"`);
  out += tag(S.x0 + 16, ly - 8, "count line · 27", accent, PAPER);
  for (let i = 0; i < 9; i++) {
    const lane = Math.floor(r() * lanes);
    const x = S.x0 + (SW / lanes) * lane + SW / lanes / 2;
    const y = between(r, S.y0 + 40, S.y1 - 120);
    out += rect(x - 42, y, 84, 130, `rx="14" fill="${PAPER}" fill-opacity="0.9"`);
    out += rect(x - 32, y + 18, 64, 40, `rx="6" fill="${INK}" fill-opacity="0.5"`);
    out += rect(x - 54, y - 12, 108, 154, `fill="none" stroke="${accent}" stroke-width="3"`);
    out += text(x - 54, y - 18, `car ${(0.8 + r() * 0.19).toFixed(2)}`, `font-size="15" fill="${accent}"`);
  }
  return out;
};

/* ---------- LLMs / agents ---------- */

const chat: Renderer = (r, accent) => {
  let out = "";
  let y = S.y0 + 10;
  for (let i = 0; i < 4; i++) {
    const h = between(r, 100, 150);
    out += rect(S.x0, y, 420, h, `rx="10" fill="${PAPER}" stroke="${RULE}" stroke-width="3"`);
    for (let k = 0; k < Math.floor(h / 26) - 1; k++)
      out += line(S.x0 + 26, y + 30 + k * 26, S.x0 + 26 + between(r, 180, 370), y + 30 + k * 26, `stroke="${INK}" stroke-opacity="${i === 1 ? 0.5 : 0.18}" stroke-width="6" stroke-linecap="round"`);
    if (i === 1) out += rect(S.x0 - 6, y - 6, 432, h + 12, `rx="14" fill="none" stroke="${accent}" stroke-width="4"`);
    y += h + 26;
  }
  out += `<path d="M${S.x0 + 440} ${f(S.y0 + 250)} C ${S.x0 + 560} ${f(S.y0 + 250)}, ${S.x0 + 560} ${f(S.y0 + 330)}, ${S.x0 + 640} ${f(S.y0 + 330)}" stroke="${accent}" stroke-width="4" fill="none" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  const bx0 = S.x0 + 680;
  let by = S.y0 + 20;
  for (let i = 0; i < 4; i++) {
    const mine = i % 2 === 1;
    const w = between(r, 320, 600), h = between(r, 80, 130);
    const x = mine ? S.x1 - w : bx0;
    out += rect(x, by, w, h, `rx="26" fill="${mine ? accent : PAPER}" fill-opacity="${mine ? 0.92 : 1}" stroke="${mine ? accent : INK}" stroke-opacity="${mine ? 1 : 0.5}" stroke-width="3"`);
    for (let k = 0; k < Math.max(1, Math.floor(h / 30) - 1); k++)
      out += line(x + 30, by + 32 + k * 28, x + 30 + between(r, w * 0.4, w - 60), by + 32 + k * 28, `stroke="${mine ? PAPER : INK}" stroke-opacity="${mine ? 0.85 : 0.25}" stroke-width="7" stroke-linecap="round"`);
    by += h + 28;
  }
  out += circle(bx0 + 34, by + 30, 8, `fill="${INK}" fill-opacity="0.35"`) + circle(bx0 + 64, by + 30, 8, `fill="${INK}" fill-opacity="0.55"`) + circle(bx0 + 94, by + 30, 8, `fill="${INK}" fill-opacity="0.85"`);
  return out;
};

/** Lecture slides → chunks → vector index → exam questions (RAG). */
const exam: Renderer = (r, accent) => {
  let out = "";
  // slides stack
  for (let i = 2; i >= 0; i--) out += rect(S.x0 + 20 + i * 14, S.y0 + 40 - i * 14, 300, 210, `rx="8" fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
  out += rect(S.x0 + 40, S.y0 + 70, 200, 16, `rx="4" fill="${INK}" fill-opacity="0.6"`);
  for (let k = 0; k < 4; k++) out += rect(S.x0 + 40, S.y0 + 105 + k * 28, between(r, 120, 250), 10, `rx="3" fill="${INK}" fill-opacity="0.2"`);
  out += text(S.x0 + 20, S.y0 + 290, "LECTURE PDF", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  // chunks → vectors
  const vx = S.x0 + 470;
  for (let i = 0; i < 5; i++) {
    const y = S.y0 + 50 + i * 60;
    out += rect(vx, y, 160, 40, `rx="6" fill="${INK}" fill-opacity="0.08" stroke="${INK}" stroke-opacity="0.4" stroke-width="2"`);
    for (let k = 0; k < 9; k++) out += rect(vx + 200 + k * 20, y + 8, 14, 24, `rx="2" fill="${accent}" fill-opacity="${f(between(r, 0.15, 0.95))}"`);
  }
  out += text(vx, S.y0 + 370, "CHUNKS → EMBEDDINGS → FAISS", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  // arrows
  out += `<path d="M${S.x0 + 340} ${S.y0 + 150} L${vx - 20} ${S.y0 + 150}" stroke="${accent}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`;
  out += `<path d="M${vx + 400} ${S.y0 + 150} C ${vx + 520} ${S.y0 + 150}, ${vx + 520} ${S.y0 + 420}, ${vx + 560} ${S.y0 + 420}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`;
  // exam paper
  const ex = S.x1 - 440, ey = S.y0 + 250;
  out += rect(ex, ey, 420, 420, `rx="8" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"`);
  out += text(ex + 24, ey + 44, "EXAM PAPER · LLaMA 3.1", `font-size="16" letter-spacing="2" fill="${INK}"`);
  const kinds = ["Q1  MCQ", "Q2  True / False", "Q3  Short answer", "Q4  Fill in the blank", "Q5  Descriptive"];
  kinds.forEach((k, i) => {
    const y = ey + 95 + i * 62;
    out += text(ex + 24, y, k, `font-size="18" fill="${INK}"`);
    out += rect(ex + 24, y + 12, between(r, 200, 360), 8, `rx="3" fill="${INK}" fill-opacity="0.18"`);
    if (i === 0) for (let c = 0; c < 4; c++) out += circle(ex + 40 + c * 40, y + 36, 7, `fill="${c === 2 ? accent : "none"}" stroke="${INK}" stroke-width="2"`);
  });
  return out;
};

/** Cooperating agents graph with tools (CrewAI). */
const agents: Renderer = (r, accent) => {
  let out = "";
  const nodes = [
    ["Planner", CX - 380, CY - 150],
    ["Researcher", CX + 60, CY - 220],
    ["Writer", CX + 420, CY - 40],
    ["Reviewer", CX + 40, CY + 210],
  ] as const;
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]];
  for (const [a, b] of edges) {
    const [, x1, y1] = nodes[a], [, x2, y2] = nodes[b];
    out += `<path d="M${f(x1)} ${f(y1)} Q ${f((x1 + x2) / 2 + 40)} ${f((y1 + y2) / 2 - 40)} ${f(x2)} ${f(y2)}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="3" stroke-dasharray="10 8"/>`;
  }
  nodes.forEach(([name, x, y], i) => {
    out += circle(x, y, 74, `fill="${i === 0 ? accent : PAPER}" stroke="${INK}" stroke-width="4"`);
    out += circle(x, y - 14, 18, `fill="${i === 0 ? PAPER : INK}" fill-opacity="0.85"`);
    out += `<path d="M${f(x - 34)} ${f(y + 40)} C ${f(x - 34)} ${f(y)}, ${f(x + 34)} ${f(y)}, ${f(x + 34)} ${f(y + 40)}" fill="${i === 0 ? PAPER : INK}" fill-opacity="0.85"/>`;
    out += text(x - name.length * 5.5, y + 108, name, `font-size="18" letter-spacing="2" fill="${INK}"`);
  });
  // tools tray
  const tools = ["web search", "FAISS RAG", "calculator"];
  tools.forEach((t, i) => {
    const x = S.x0 + 20, y = S.y1 - 150 + i * 46;
    out += rect(x, y, 30, 30, `rx="6" fill="${accent}" fill-opacity="0.85"`);
    out += text(x + 44, y + 22, t, `font-size="18" fill="${MUTED}"`);
  });
  return out;
};

/* ---------- FPGA / digital ---------- */

const circuit: Renderer = (r, accent) => {
  let out = "";
  const g = 40;
  const chips: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 2 + Math.floor(r() * 2); i++) {
    const w = g * (4 + Math.floor(r() * 4)), h = g * (3 + Math.floor(r() * 3));
    chips.push({ x: S.x0 + g * Math.floor(between(r, 1, SW / g - w / g - 1)), y: S.y0 + g * Math.floor(between(r, 1, SH / g - h / g - 1)), w, h });
  }
  for (let i = 0; i < 26 + Math.floor(r() * 10); i++) {
    let x = S.x0 + g * Math.floor(between(r, 0, SW / g)), y = S.y0 + g * Math.floor(between(r, 0, SH / g));
    let d = `M${x} ${y}`;
    let horiz = r() < 0.5;
    for (let s = 0; s < 3 + Math.floor(r() * 6); s++) {
      const len = g * (1 + Math.floor(r() * 5)) * (r() < 0.5 ? -1 : 1);
      if (horiz) x = Math.max(S.x0, Math.min(S.x1, x + len));
      else y = Math.max(S.y0, Math.min(S.y1, y + len));
      d += ` L${x} ${y}`;
      horiz = !horiz;
    }
    const hot = r() < 0.22;
    out += `<path d="${d}" fill="none" stroke="${hot ? accent : INK}" stroke-opacity="${hot ? 0.9 : 0.28}" stroke-width="${hot ? 5 : 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
    out += circle(x, y, hot ? 9 : 6, `fill="${PAPER}" stroke="${hot ? accent : INK}" stroke-opacity="${hot ? 1 : 0.5}" stroke-width="3"`);
  }
  for (const c of chips) {
    out += rect(c.x, c.y, c.w, c.h, `rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="4"`);
    out += rect(c.x + 14, c.y + 14, c.w - 28, c.h - 28, `rx="3" fill="${INK}" fill-opacity="0.9"`);
    out += circle(c.x + 30, c.y + 30, 6, `fill="${accent}"`);
    for (let px = c.x + g / 2; px < c.x + c.w; px += g) out += line(px, c.y - 14, px, c.y, `stroke="${INK}" stroke-width="4"`) + line(px, c.y + c.h, px, c.y + c.h + 14, `stroke="${INK}" stroke-width="4"`);
  }
  let d = `M${S.x0} ${S.y1 + 60}`;
  let lvl = 1;
  for (let x = S.x0; x < S.x1; x += 38) {
    d += ` L${x} ${S.y1 + 60 - lvl * 26} L${x + 38} ${S.y1 + 60 - lvl * 26}`;
    lvl = 1 - lvl;
  }
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linejoin="round"/>`;
  return out;
};

/** Five pipeline stages with instructions in flight and a forwarding path. */
const pipeline: Renderer = (r, accent) => {
  let out = "";
  const stages = ["IF", "ID", "EX", "MEM", "WB"];
  const gap = SW / 5;
  const top = S.y0 + 60, h = 420;
  stages.forEach((s, i) => {
    const x = S.x0 + i * gap + 20;
    out += rect(x, top, gap - 40, h, `rx="10" fill="${i === 2 ? tint(accent, 0.12) : PAPER}" stroke="${INK}" stroke-width="3.5"`);
    out += text(x + 18, top + 40, s, `font-size="30" font-weight="700" fill="${INK}"`);
    // pipeline register
    if (i < 4) out += rect(x + gap - 40 + 6, top + 20, 28, h - 40, `rx="4" fill="${INK}"`);
    // instruction rows
    for (let k = 0; k < 4; k++) {
      const active = (k + i) % 4 === 1;
      out += rect(x + 18, top + 90 + k * 76, gap - 76, 44, `rx="6" fill="${active ? accent : INK}" fill-opacity="${active ? 0.85 : 0.1}"`);
      out += text(x + 30, top + 118 + k * 76, ["add", "lw", "beq", "sub"][(k + i) % 4], `font-size="18" fill="${active ? PAPER : INK}"`);
    }
  });
  // forwarding path EX → EX
  out += `<path d="M${f(S.x0 + 3 * gap - 60)} ${top + h + 10} C ${f(S.x0 + 3 * gap - 60)} ${top + h + 120}, ${f(S.x0 + 2 * gap + 40)} ${top + h + 120}, ${f(S.x0 + 2 * gap + 40)} ${top + h + 10}" fill="none" stroke="${accent}" stroke-width="4" marker-end="url(#fw)"/>`;
  out += `<defs><marker id="fw" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${accent}"/></marker></defs>`;
  out += text(S.x0 + 2 * gap + 60, top + h + 100, "forwarding", `font-size="18" fill="${accent}"`);
  // clock
  let d = `M${S.x0} ${S.y1 + 50}`;
  let lvl = 1;
  for (let x = S.x0; x < S.x1; x += 44) {
    d += ` L${x} ${S.y1 + 50 - lvl * 22} L${x + 44} ${S.y1 + 50 - lvl * 22}`;
    lvl = 1 - lvl;
  }
  out += `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="3"/>`;
  return out;
};

/** Single-cycle datapath blocks with buses. */
const datapath: Renderer = (r, accent) => {
  let out = "";
  const blocks: [string, number, number, number, number][] = [
    ["PC", S.x0 + 10, CY - 50, 90, 100],
    ["Instr Mem", S.x0 + 150, CY - 90, 190, 180],
    ["Reg File", S.x0 + 430, CY - 120, 200, 240],
    ["Imm Gen", S.x0 + 430, CY + 150, 200, 80],
    ["ALU", S.x0 + 730, CY - 80, 140, 160],
    ["Data Mem", S.x0 + 970, CY - 90, 190, 180],
    ["Control", S.x0 + 430, S.y0 + 10, 200, 80],
    ["Branch Cmp", S.x0 + 730, S.y0 + 10, 190, 80],
  ];
  const buses: [number, number, number, number, boolean][] = [
    [S.x0 + 100, CY, S.x0 + 150, CY, false],
    [S.x0 + 340, CY, S.x0 + 430, CY, false],
    [S.x0 + 630, CY - 40, S.x0 + 730, CY - 40, true],
    [S.x0 + 630, CY + 40, S.x0 + 730, CY + 40, true],
    [S.x0 + 870, CY, S.x0 + 970, CY, true],
    [S.x0 + 1160, CY, S.x0 + 1300, CY, false],
  ];
  for (const [x1, y1, x2, y2, hot] of buses) {
    out += line(x1, y1, x2, y2, `stroke="${hot ? accent : INK}" stroke-width="${hot ? 8 : 6}" stroke-opacity="${hot ? 0.9 : 0.5}"`);
  }
  // writeback loop
  out += `<path d="M${S.x0 + 1300} ${CY} L${S.x0 + 1300} ${S.y1 - 20} L${S.x0 + 380} ${S.y1 - 20} L${S.x0 + 380} ${CY + 80} L${S.x0 + 430} ${CY + 80}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="5"/>`;
  for (const [name, x, y, w, h] of blocks) {
    const ctrl = name === "Control" || name === "Branch Cmp";
    out += name === "ALU"
      ? `<path d="M${x} ${y} L${x + w} ${y + 40} L${x + w} ${y + h - 40} L${x} ${y + h} L${x} ${y + h / 2 + 20} L${x + 30} ${y + h / 2} L${x} ${y + h / 2 - 20} Z" fill="${tint(accent, 0.15)}" stroke="${INK}" stroke-width="3.5"/>`
      : rect(x, y, w, h, `rx="8" fill="${ctrl ? INK : PAPER}" stroke="${INK}" stroke-width="3.5"`);
    out += text(x + 14, y + (name === "ALU" ? h / 2 + 8 : 32), name, `font-size="19" fill="${ctrl ? PAPER : INK}"`);
  }
  // control signals
  for (const x of [S.x0 + 520, S.x0 + 800, S.x0 + 1060]) out += line(x, S.y0 + 90, x, CY - 95, `stroke="${accent}" stroke-width="2.5" stroke-dasharray="6 6"`);
  return out;
};

/** State machine diagram (car security). */
const fsm: Renderer = (r, accent) => {
  let out = "";
  const states = [
    ["IDLE", CX - 440, CY - 120],
    ["ARMED", CX - 60, CY - 220],
    ["TRIGGERED", CX + 380, CY - 120],
    ["ALARM", CX + 200, CY + 200],
    ["LOCKOUT", CX - 300, CY + 200],
  ] as const;
  const edges: [number, number, string][] = [[0, 1, "key off"], [1, 2, "sensor"], [2, 3, "timeout"], [3, 4, "fuel cut"], [4, 0, "reset"], [1, 0, "key on"]];
  for (const [a, b, label] of edges) {
    const [, x1, y1] = states[a], [, x2, y2] = states[b];
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25, my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
    const hot = a === 2 || a === 3;
    out += `<path d="M${f(x1)} ${f(y1)} Q ${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}" fill="none" stroke="${hot ? accent : INK}" stroke-opacity="${hot ? 1 : 0.5}" stroke-width="3.5" marker-end="url(#fsmArr)"/>`;
    out += text(mx - label.length * 4, my - 6, label, `font-size="16" fill="${MUTED}"`);
  }
  out += `<defs><marker id="fsmArr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${INK}" fill-opacity="0.7"/></marker></defs>`;
  states.forEach(([name, x, y], i) => {
    const hot = i === 3;
    out += circle(x, y, 70, `fill="${hot ? accent : PAPER}" stroke="${INK}" stroke-width="4"`);
    if (i === 0) out += circle(x, y, 60, `fill="none" stroke="${INK}" stroke-width="2"`);
    out += text(x - name.length * 6, y + 7, name, `font-size="19" font-weight="700" fill="${hot ? PAPER : INK}"`);
  });
  return out;
};

/** Systolic array of MACs with a conv kernel sliding over a feature map (accelerator). */
const accelerator: Renderer = (r, accent) => {
  let out = "";
  // feature map on the left
  const fx = S.x0 + 20, fy = S.y0 + 40, cell = 34, n = 14;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = 0.5 + 0.5 * Math.sin(i * 0.6) * Math.cos(j * 0.5) + between(r, -0.1, 0.1);
      out += rect(fx + i * cell, fy + j * cell, cell - 2, cell - 2, `fill="${INK}" fill-opacity="${f(0.06 + v * 0.35)}"`);
    }
  out += rect(fx + 4 * cell - 3, fy + 5 * cell - 3, 3 * cell + 4, 3 * cell + 4, `fill="none" stroke="${accent}" stroke-width="4"`);
  out += text(fx, fy + n * cell + 30, "INPUT FEATURE MAP · 3×3 KERNEL", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  // arrow
  out += `<path d="M${fx + n * cell + 20} ${CY} L${fx + n * cell + 120} ${CY}" stroke="${accent}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`;
  // systolic array
  const ax = S.x0 + 680, ay = S.y0 + 40, pe = 78, m = 8;
  out += rect(ax - 24, ay - 24, m * pe + 30, m * pe + 30, `rx="12" fill="${INK}"`);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < m; j++) {
      const active = (i + j) % 3 === 0;
      out += rect(ax + i * pe, ay + j * pe, pe - 10, pe - 10, `rx="6" fill="${active ? accent : PAPER}" fill-opacity="${active ? 0.95 : 0.25}"`);
      if (active) out += text(ax + i * pe + 14, ay + j * pe + 42, "MAC", `font-size="15" fill="${PAPER}"`);
    }
  out += text(ax - 24, ay + m * pe + 40, "SYSTOLIC PE ARRAY · INT8 · BRAM", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  return out;
};

/** Cache sets/ways with hits and misses (cache simulator). */
const cacheblocks: Renderer = (r, accent) => {
  let out = "";
  const sets = 8, ways = 4;
  const bw = (SW - 300) / ways, bh = (SH - 80) / sets;
  for (let s = 0; s < sets; s++) {
    out += text(S.x0, S.y0 + 40 + s * bh + bh / 2 + 6, `set ${s}`, `font-size="17" fill="${MUTED}"`);
    for (let w = 0; w < ways; w++) {
      const x = S.x0 + 120 + w * bw, y = S.y0 + 40 + s * bh;
      const v = r();
      const state = v < 0.15 ? "miss" : v < 0.3 ? "lru" : "hit";
      out += rect(x + 4, y + 4, bw - 8, bh - 8, `rx="5" fill="${state === "hit" ? INK : state === "lru" ? accent : PAPER}" fill-opacity="${state === "hit" ? 0.12 : state === "lru" ? 0.85 : 1}" stroke="${state === "miss" ? accent : INK}" stroke-opacity="${state === "miss" ? 1 : 0.35}" stroke-width="${state === "miss" ? 3 : 2}" ${state === "miss" ? 'stroke-dasharray="8 6"' : ""}`);
      out += text(x + 16, y + bh / 2 + 6, state === "lru" ? "evict (LRU)" : `tag 0x${Math.floor(r() * 0xffff).toString(16).padStart(4, "0")}`, `font-size="16" fill="${state === "lru" ? PAPER : INK}" fill-opacity="${state === "hit" ? 0.8 : 1}"`);
    }
  }
  out += text(S.x0 + 120, S.y0 + 22, "4-WAY SET ASSOCIATIVE · valgrind trace replay", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  return out;
};

/* ---------- Embedded / IoT ---------- */

const pcb: Renderer = (r, accent) => {
  let out = rect(S.x0, S.y0, SW, SH, `rx="28" fill="${tint(accent, 0.06)}" stroke="${INK}" stroke-width="4"`);
  for (const [cx, cy] of [[S.x0 + 44, S.y0 + 44], [S.x1 - 44, S.y0 + 44], [S.x0 + 44, S.y1 - 44], [S.x1 - 44, S.y1 - 44]]) out += circle(cx, cy, 16, `fill="${PAPER}" stroke="${INK}" stroke-width="4"`);
  const mx = S.x0 + 160, my = S.y0 + 150;
  out += rect(mx, my, 260, 260, `rx="10" fill="${INK}"`);
  out += circle(mx + 34, my + 34, 9, `fill="${PAPER}" fill-opacity="0.7"`);
  for (let i = 0; i < 9; i++) {
    const p = mx + 30 + i * 25, q = my + 30 + i * 25;
    out += rect(p, my - 26, 10, 26, `fill="${INK}"`) + rect(p, my + 260, 10, 26, `fill="${INK}"`) + rect(mx - 26, q, 26, 10, `fill="${INK}"`) + rect(mx + 260, q, 26, 10, `fill="${INK}"`);
  }
  for (let i = 0; i < 14; i++) {
    const vert = r() < 0.5;
    out += rect(between(r, S.x0 + 480, S.x1 - 120), between(r, S.y0 + 60, S.y1 - 260), vert ? 22 : 60, vert ? 60 : 22, `rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
  }
  for (let i = 0; i < 18; i++) {
    const y0 = my + 30 + (i % 9) * 25 + 5, x1 = between(r, S.x0 + 520, S.x1 - 100), y1 = between(r, S.y0 + 60, S.y1 - 250);
    out += `<path d="M${mx + 286} ${y0} L${f(x1 - 60)} ${y0} L${f(x1)} ${f(y1)}" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="3" stroke-linejoin="round"/>` + circle(x1, y1, 6, `fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
  }
  let d = "";
  const base = S.y1 - 120;
  for (let x = S.x0 + 60; x <= S.x1 - 60; x += 6) {
    const t = (x - S.x0) / 140;
    d += (d ? " L" : "M") + `${x} ${f(base + Math.sin(t * Math.PI) * 60 * (0.7 + 0.3 * Math.sin(t * 0.9)))}`;
  }
  out += line(S.x0 + 60, base, S.x1 - 60, base, `stroke="${INK}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 8"`);
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  for (let i = 0; i < 24; i++) out += rect(S.x0 + 60 + i * 58, S.y1 - 40, 40, 14, `fill="${r() < 0.6 ? accent : INK}" fill-opacity="${r() < 0.6 ? 0.9 : 0.15}"`);
  return out;
};

/** Particles and a gauge (air quality). */
const particles: Renderer = (r, accent) => {
  let out = "";
  for (let i = 0; i < 160; i++) {
    const x = between(r, S.x0, S.x1), y = between(r, S.y0, S.y1);
    const big = r() < 0.15;
    out += circle(x, y, big ? between(r, 8, 16) : between(r, 2, 6), `fill="${big ? accent : INK}" fill-opacity="${f(big ? between(r, 0.25, 0.6) : between(r, 0.1, 0.4))}"`);
    if (big) out += text(x + 20, y + 5, r() < 0.5 ? "PM2.5" : "PM10", `font-size="13" fill="${MUTED}"`);
  }
  // gauge
  const gx = S.x0 + 380, gy = S.y1 - 60, R = 300;
  const seg = [["#4E6B2F", 0], ["#B8A31E", 1], ["#C7702A", 2], [accent, 3], ["#5B4B8A", 4]] as const;
  seg.forEach(([c, i]) => {
    const a0 = Math.PI + (i / 5) * Math.PI, a1 = Math.PI + ((i + 1) / 5) * Math.PI;
    out += `<path d="M${f(gx + Math.cos(a0) * R)} ${f(gy + Math.sin(a0) * R)} A ${R} ${R} 0 0 1 ${f(gx + Math.cos(a1) * R)} ${f(gy + Math.sin(a1) * R)}" fill="none" stroke="${c}" stroke-width="34" stroke-opacity="0.85"/>`;
  });
  const na = Math.PI + 0.62 * Math.PI;
  out += line(gx, gy, gx + Math.cos(na) * (R - 40), gy + Math.sin(na) * (R - 40), `stroke="${INK}" stroke-width="7" stroke-linecap="round"`) + circle(gx, gy, 16, `fill="${INK}"`);
  out += text(gx - 40, gy - 60, "AQI", `font-size="26" letter-spacing="4" fill="${INK}"`);
  // sensor list
  ["PMS5003", "MQ7 · CO", "MQ135", "DHT22", "BME280"].forEach((s, i) => out += rect(S.x1 - 330, S.y0 + 30 + i * 52, 12, 30, `fill="${accent}"`) + text(S.x1 - 300, S.y0 + 52 + i * 52, s, `font-size="20" fill="${INK}"`));
  return out;
};

/** Egg tray with a temperature / humidity trace (incubator). */
const eggs: Renderer = (r, accent) => {
  let out = "";
  const cols = 8, rows = 3;
  const ex = S.x0 + 40, ey = S.y0 + 40, cw = 150, ch = 130;
  out += rect(ex - 20, ey - 20, cols * cw + 40, rows * ch + 40, `rx="18" fill="${INK}" fill-opacity="0.08" stroke="${INK}" stroke-width="3"`);
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = ex + i * cw + cw / 2, y = ey + j * ch + ch / 2;
      const hatched = j === rows - 1 && r() < 0.35;
      out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="46" ry="58" fill="${hatched ? accent : PAPER}" fill-opacity="${hatched ? 0.85 : 1}" stroke="${INK}" stroke-width="3" transform="rotate(${f(between(r, -14, 14))} ${f(x)} ${f(y)})"/>`;
      if (hatched) out += `<path d="M${f(x - 40)} ${f(y - 10)} L${f(x - 20)} ${f(y + 6)} L${f(x)} ${f(y - 12)} L${f(x + 20)} ${f(y + 6)} L${f(x + 40)} ${f(y - 10)}" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
    }
  // trace
  const base = S.y1 - 40;
  out += line(S.x0 + 40, base, S.x1 - 40, base, `stroke="${INK}" stroke-opacity="0.3" stroke-width="2"`);
  let d = "", d2 = "";
  for (let x = S.x0 + 40; x <= S.x1 - 40; x += 8) {
    const t = (x - S.x0) / 200;
    d += (d ? " L" : "M") + `${x} ${f(base - 110 + Math.sin(t * 2.2) * 8 + between(r, -2, 2))}`;
    d2 += (d2 ? " L" : "M") + `${x} ${f(base - 60 + Math.sin(t * 1.4 + 1) * 14 + between(r, -2, 2))}`;
  }
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="4"/>` + `<path d="${d2}" fill="none" stroke="${INK}" stroke-opacity="0.55" stroke-width="3" stroke-dasharray="10 6"/>`;
  out += text(S.x0 + 44, base - 120, "37.5 °C", `font-size="17" fill="${accent}"`) + text(S.x0 + 44, base - 70, "55 % RH", `font-size="17" fill="${MUTED}"`);
  return out;
};

/** ECG trace with SpO2 / temperature tiles (health monitor). */
const ecg: Renderer = (r, accent) => {
  let out = faintGrid(30, 0.07);
  let d = "";
  const base = CY - 40;
  for (let x = S.x0; x <= S.x1; x += 3) {
    const t = ((x - S.x0) % 300) / 300;
    let y = base + between(r, -2, 2);
    if (t > 0.1 && t < 0.16) y = base - 14 * Math.sin(((t - 0.1) / 0.06) * Math.PI);
    if (t > 0.28 && t < 0.3) y = base + 18;
    if (t > 0.3 && t < 0.34) y = base - 160 * Math.sin(((t - 0.3) / 0.04) * Math.PI);
    if (t > 0.34 && t < 0.37) y = base + 40;
    if (t > 0.5 && t < 0.62) y = base - 30 * Math.sin(((t - 0.5) / 0.12) * Math.PI);
    d += (d ? " L" : "M") + `${x} ${f(y)}`;
  }
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>`;
  const tiles: [string, string][] = [["72", "BPM"], ["98%", "SpO₂"], ["36.7°", "TEMP"], ["OK", "FALL"]];
  tiles.forEach(([v, l], i) => {
    const x = S.x0 + i * 350, y = S.y1 - 200;
    out += rect(x, y, 320, 170, `rx="10" fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
    out += `<text x="${x + 24}" y="${y + 100}" font-family="Georgia, serif" font-size="72" fill="${INK}">${esc(v)}</text>`;
    out += text(x + 24, y + 140, l, `font-size="16" letter-spacing="3" fill="${MUTED}"`);
  });
  return out;
};

/** Meter dial with consumption bars and an anomaly (electricity theft). */
const meter: Renderer = (r, accent) => {
  let out = "";
  const mx = S.x0 + 330, my = CY + 20, R = 260;
  out += circle(mx, my, R, `fill="${PAPER}" stroke="${INK}" stroke-width="5"`);
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI * 0.75 + (i / 20) * Math.PI * 1.5;
    out += line(mx + Math.cos(a) * (R - 40), my + Math.sin(a) * (R - 40), mx + Math.cos(a) * (R - (i % 5 === 0 ? 70 : 55)), my + Math.sin(a) * (R - (i % 5 === 0 ? 70 : 55)), `stroke="${INK}" stroke-width="${i % 5 === 0 ? 4 : 2}"`);
  }
  const na = Math.PI * 0.75 + 0.82 * Math.PI * 1.5;
  out += line(mx, my, mx + Math.cos(na) * (R - 80), my + Math.sin(na) * (R - 80), `stroke="${accent}" stroke-width="7" stroke-linecap="round"`) + circle(mx, my, 14, `fill="${INK}"`);
  out += rect(mx - 90, my + 90, 180, 50, `rx="6" fill="${INK}"`) + text(mx - 70, my + 124, "0 4 2 7 . 3 kWh", `font-size="22" fill="${PAPER}"`);
  // bars
  const bx = S.x0 + 720, base = S.y1 - 40, n = 24;
  for (let i = 0; i < n; i++) {
    const anomaly = i >= 15 && i <= 17;
    const h = anomaly ? between(r, 20, 45) : between(r, 150, 330);
    out += rect(bx + i * 32, base - h, 24, h, `rx="3" fill="${anomaly ? accent : INK}" fill-opacity="${anomaly ? 0.95 : 0.3}"`);
  }
  out += rect(bx + 15 * 32 - 8, base - 340, 3 * 32 + 12, 340, `fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="8 6"`);
  out += tag(bx + 15 * 32 - 8, base - 350, "tamper detected", accent, PAPER);
  return out;
};

/** Beam, ball and PID response curve. */
const pid: Renderer = (r, accent) => {
  let out = "";
  const px = CX - 200, py = CY + 40;
  out += rect(px - 20, py - 10, 40, 220, `rx="8" fill="${INK}"`) + rect(px - 60, py + 200, 120, 18, `rx="4" fill="${INK}"`);
  out += `<g transform="rotate(-9 ${px} ${py})">${rect(px - 420, py - 12, 840, 24, `rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"`)}${circle(px + 150, py - 46, 34, `fill="${accent}"`)}${line(px + 150, py - 12, px + 150, py - 120, `stroke="${INK}" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="6 6"`)}</g>`;
  out += circle(px, py, 22, `fill="${PAPER}" stroke="${INK}" stroke-width="4"`);
  // ultrasonic sensor + servo
  out += rect(px - 470, py - 90, 60, 40, `rx="6" fill="${INK}"`) + circle(px - 455, py - 70, 8, `fill="${PAPER}"`) + circle(px - 425, py - 70, 8, `fill="${PAPER}"`);
  for (let k = 1; k <= 3; k++) out += `<path d="M${px - 400 + k * 30} ${py - 100 - k * 8} A ${k * 24} ${k * 24} 0 0 1 ${px - 400 + k * 30} ${py - 40 + k * 8}" fill="none" stroke="${accent}" stroke-opacity="${f(1 - k * 0.25)}" stroke-width="2.5"/>`;
  // response curve
  const gx = S.x1 - 520, gy = S.y0 + 40, gw = 500, gh = 300;
  out += rect(gx, gy, gw, gh, `rx="8" fill="${PAPER}" stroke="${INK}" stroke-opacity="0.4" stroke-width="2"`);
  out += line(gx, gy + gh * 0.45, gx + gw, gy + gh * 0.45, `stroke="${INK}" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="8 6"`);
  let d = "";
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const y = gy + gh * 0.45 + (gh * 0.5) * Math.exp(-t * 4.5) * Math.cos(t * 22) * -1 + (t < 0.02 ? gh * 0.45 : 0);
    d += (d ? " L" : "M") + `${f(gx + t * gw)} ${f(Math.min(gy + gh - 4, y))}`;
  }
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="4"/>`;
  out += text(gx + 12, gy + gh + 28, "Kp · Ki · Kd  →  settles < 30 s", `font-size="16" letter-spacing="1" fill="${MUTED}"`);
  return out;
};

/** Carrier, message and modulated envelope (AM). */
const am: Renderer = (r, accent) => {
  let out = "";
  const rows: [string, (t: number) => number, string, boolean][] = [
    ["message  120 kHz", (t) => Math.sin(t * 1.2), INK, false],
    ["carrier  1.2 MHz", (t) => Math.sin(t * 14), INK, false],
    ["AM  →  IF 455 kHz  →  envelope", (t) => (1 + 0.7 * Math.sin(t * 1.2)) * Math.sin(t * 14), accent, true],
  ];
  rows.forEach(([label, fn, c, env], i) => {
    const base = S.y0 + 110 + i * 230;
    const amp = i === 2 ? 95 : 55;
    out += text(S.x0, base - amp - 18, label, `font-size="16" letter-spacing="2" fill="${MUTED}"`);
    out += line(S.x0, base, S.x1, base, `stroke="${INK}" stroke-opacity="0.2" stroke-width="1.5"`);
    let d = "";
    for (let x = S.x0; x <= S.x1; x += 2) {
      const t = ((x - S.x0) / SW) * 12;
      d += (d ? " L" : "M") + `${x} ${f(base - fn(t) * amp)}`;
    }
    out += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${i === 2 ? 3 : 2.5}"/>`;
    if (env) {
      let e = "";
      for (let x = S.x0; x <= S.x1; x += 4) {
        const t = ((x - S.x0) / SW) * 12;
        e += (e ? " L" : "M") + `${x} ${f(base - (1 + 0.7 * Math.sin(t * 1.2)) * amp)}`;
      }
      out += `<path d="${e}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="10 8"/>`;
    }
  });
  return out;
};

/* ---------- Robotics ---------- */

const robotBody = (x: number, y: number, accent: string) =>
  rect(x - 40, y - 30, 80, 60, `rx="10" fill="${PAPER}" stroke="${INK}" stroke-width="4"`) +
  rect(x - 48, y - 22, 10, 20, `fill="${INK}"`) + rect(x + 38, y - 22, 10, 20, `fill="${INK}"`) + rect(x - 48, y + 4, 10, 20, `fill="${INK}"`) + rect(x + 38, y + 4, 10, 20, `fill="${INK}"`) +
  circle(x, y - 40, 6, `fill="${accent}"`);

const pathMotif: Renderer = (r, accent) => {
  let out = faintGrid(70, 0.06);
  for (let i = 0; i < 6; i++) {
    const x = between(r, S.x0 + 120, S.x1 - 200), y = between(r, S.y0 + 80, S.y1 - 160), w = between(r, 70, 150), h = between(r, 60, 120);
    out += rect(x, y, w, h, `fill="${INK}" fill-opacity="0.12" stroke="${INK}" stroke-width="3"`) + line(x, y, x + w, y + h, `stroke="${INK}" stroke-opacity="0.35" stroke-width="2"`);
  }
  const pts: number[][] = [[S.x0 + 40, S.y1 - 80]];
  for (let i = 1; i <= 5; i++) pts.push([S.x0 + (SW * i) / 5 - between(r, 0, 80), between(r, S.y0 + 80, S.y1 - 80)]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i], cx = (px + x) / 2;
    d += ` C ${f(cx)} ${f(py)}, ${f(cx)} ${f(y)}, ${f(x)} ${f(y)}`;
  }
  out += `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="0.2" stroke-width="26" stroke-linecap="round"/>` + `<path d="${d}" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="22 16" stroke-linecap="round"/>`;
  const [rx, ry] = pts[pts.length - 1];
  out += robotBody(rx, ry, accent);
  for (let k = 1; k <= 4; k++) {
    const rad = 50 + k * 34;
    out += `<path d="M${f(rx + rad * Math.cos(-0.55))} ${f(ry - 30 + rad * Math.sin(-0.55))} A ${rad} ${rad} 0 0 0 ${f(rx + rad * Math.cos(-2.59))} ${f(ry - 30 + rad * Math.sin(-2.59))}" fill="none" stroke="${accent}" stroke-opacity="${f(1 - k * 0.2)}" stroke-width="3"/>`;
  }
  for (const [x, y] of pts.slice(0, -1)) out += circle(x, y, 8, `fill="${PAPER}" stroke="${INK}" stroke-width="3"`);
  return out;
};

/** Black track line on white with IR sensors reading it (line follower). */
const linetrack: Renderer = (r, accent) => {
  let out = "";
  let d = `M${S.x0 + 40} ${S.y1 - 100}`;
  const pts = [[S.x0 + 300, S.y0 + 200], [S.x0 + 620, S.y1 - 120], [S.x0 + 900, S.y0 + 260], [S.x0 + 1200, S.y0 + 500], [S.x1 - 40, S.y0 + 120]];
  let prev = [S.x0 + 40, S.y1 - 100];
  for (const [x, y] of pts) {
    const cx = (prev[0] + x) / 2;
    d += ` C ${f(cx)} ${f(prev[1])}, ${f(cx)} ${f(y)}, ${f(x)} ${f(y)}`;
    prev = [x, y];
  }
  out += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>`;
  const [rx, ry] = [S.x0 + 620, S.y1 - 120];
  out += `<g transform="rotate(-30 ${rx} ${ry})">${robotBody(rx, ry - 40, accent)}${circle(rx - 22, ry - 74, 9, `fill="${accent}"`)}${circle(rx + 22, ry - 74, 9, `fill="${PAPER}" stroke="${INK}" stroke-width="3"`)}</g>`;
  out += text(S.x0 + 40, S.y0 + 40, "IR LEFT: 1   IR RIGHT: 0   →  turn left", `font-size="18" letter-spacing="2" fill="${MUTED}"`);
  return out;
};

/** Robot following a person, IR sensor cones (human follower). */
const follow: Renderer = (r, accent) => {
  let out = faintGrid(70, 0.05);
  const hx = S.x0 + 1080, hy = CY - 40;
  // person
  out += circle(hx, hy - 150, 40, `fill="${INK}"`) + rect(hx - 44, hy - 100, 88, 170, `rx="30" fill="${INK}"`) + rect(hx - 40, hy + 60, 30, 140, `rx="12" fill="${INK}"`) + rect(hx + 10, hy + 60, 30, 140, `rx="12" fill="${INK}"`);
  // robot + cones
  const rx = S.x0 + 380, ry = CY + 60;
  out += `<g transform="rotate(90 ${rx} ${ry})">${robotBody(rx, ry, accent)}</g>`;
  for (const [ang, hot] of [[-0.35, false], [0, true], [0.35, false]] as const) {
    const L = 600;
    const x2 = rx + Math.cos(ang) * L, y2 = ry + Math.sin(ang) * L;
    out += `<path d="M${rx} ${ry} L${f(x2 - Math.sin(ang) * 40)} ${f(y2 + Math.cos(ang) * 40)} L${f(x2 + Math.sin(ang) * 40)} ${f(y2 - Math.cos(ang) * 40)} Z" fill="${hot ? accent : INK}" fill-opacity="${hot ? 0.25 : 0.06}"/>`;
  }
  // trail
  let d = "";
  for (let i = 0; i < 8; i++) d += (d ? " L" : "M") + `${f(rx - 300 + i * 40)} ${f(ry + Math.sin(i) * 30)}`;
  out += `<path d="${d} L${rx - 50} ${ry}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="4 14" stroke-linecap="round"/>`;
  out += text(S.x0 + 20, S.y0 + 40, "3 × IR  ·  centre sensor locked  →  forward", `font-size="18" letter-spacing="2" fill="${MUTED}"`);
  return out;
};

/* ---------- Web / product ---------- */

const ledger: Renderer = (r, accent) => {
  let out = "";
  const rows = 9, rowH = SH / rows, hi = Math.floor(r() * rows);
  for (let i = 0; i < rows; i++) {
    const y = S.y0 + i * rowH;
    if (i === hi) out += rect(S.x0 - 20, y, SW + 40, rowH, `fill="${tint(accent, 0.1)}"`);
    out += line(S.x0, y + rowH, S.x1, y + rowH, `stroke="${RULE}" stroke-width="2.5"`);
    out += rect(S.x0, y + rowH / 2 - 8, 90, 16, `rx="4" fill="${INK}" fill-opacity="0.22"`);
    out += rect(S.x0 + 130, y + rowH / 2 - 9, between(r, 180, 420), 18, `rx="4" fill="${INK}" fill-opacity="${i === hi ? 0.8 : 0.4}"`);
    out += rect(S.x0 + 640, y + rowH / 2 - 14, between(r, 90, 160), 28, `rx="14" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="2"`);
    const w = between(r, 60, 380), neg = r() < 0.55;
    out += rect(S.x1 - w, y + rowH / 2 - 10, w, 20, `rx="3" fill="${neg ? INK : accent}" fill-opacity="${neg ? 0.28 : 0.9}"`);
  }
  // receipt being scanned
  out += `<g transform="rotate(-8 ${S.x0 + 1180} ${S.y0 + 200})">${rect(S.x0 + 1100, S.y0 + 60, 200, 280, `fill="${PAPER}" stroke="${INK}" stroke-width="3"`)}${Array.from({ length: 8 }, (_, k) => rect(S.x0 + 1120, S.y0 + 90 + k * 30, between(r, 60, 160), 8, `rx="3" fill="${INK}" fill-opacity="0.3"`)).join("")}${rect(S.x0 + 1090, S.y0 + 200, 220, 4, `fill="${accent}"`)}</g>`;
  out += line(S.x0, S.y1 + 30, S.x1, S.y1 + 30, `stroke="${INK}" stroke-width="4"`) + line(S.x0, S.y1 + 40, S.x1, S.y1 + 40, `stroke="${INK}" stroke-width="1.5"`);
  return out;
};

/** Face outline with landmarks and a frame recommendation (eyewear). */
const face: Renderer = (r, accent) => {
  let out = "";
  const fx = S.x0 + 420, fy = CY;
  out += `<ellipse cx="${fx}" cy="${fy}" rx="230" ry="300" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
  // landmarks
  for (let i = 0; i < 68; i++) {
    const a = (i / 68) * Math.PI * 2;
    const inner = i % 3 === 0;
    const rx = inner ? between(r, 60, 150) : 230, ry = inner ? between(r, 40, 200) : 300;
    out += circle(fx + Math.cos(a) * rx, fy + Math.sin(a) * ry, 4, `fill="${accent}"`);
  }
  // eyes, nose, mouth
  for (const s of [-1, 1]) out += `<ellipse cx="${fx + s * 85}" cy="${fy - 60}" rx="34" ry="18" fill="none" stroke="${INK}" stroke-width="3"/>` + circle(fx + s * 85, fy - 60, 9, `fill="${INK}"`);
  out += `<path d="M${fx} ${fy - 30} L${fx - 18} ${fy + 50} L${fx + 18} ${fy + 50}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  out += `<path d="M${fx - 60} ${fy + 130} Q ${fx} ${fy + 175} ${fx + 60} ${fy + 130}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  // glasses frame
  for (const s of [-1, 1]) out += rect(fx + s * 85 - 68, fy - 100, 136, 84, `rx="26" fill="none" stroke="${accent}" stroke-width="8"`);
  out += line(fx - 17, fy - 60, fx + 17, fy - 60, `stroke="${accent}" stroke-width="8"`);
  // recommendation panel
  const px = S.x0 + 780;
  out += text(px, S.y0 + 40, "FACE SHAPE", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  ["oval  0.62", "heart  0.21", "round  0.11"].forEach((l, i) => {
    out += text(px, S.y0 + 90 + i * 60, l, `font-size="22" fill="${INK}"`);
    out += rect(px, S.y0 + 104 + i * 60, [420, 150, 80][i], 10, `rx="5" fill="${i === 0 ? accent : INK}" fill-opacity="${i === 0 ? 0.9 : 0.3}"`);
  });
  out += text(px, S.y0 + 320, "RECOMMENDED FRAMES", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  ["Rectangle", "Square", "Wayfarer"].forEach((n, i) => {
    const y = S.y0 + 350 + i * 100;
    out += rect(px, y, 90, 50, `rx="${[8, 4, 18][i]}" fill="none" stroke="${INK}" stroke-width="4"`) + rect(px + 110, y, 90, 50, `rx="${[8, 4, 18][i]}" fill="none" stroke="${INK}" stroke-width="4"`) + line(px + 90, y + 20, px + 110, y + 20, `stroke="${INK}" stroke-width="4"`);
    out += text(px + 230, y + 34, n, `font-size="22" fill="${INK}"`);
  });
  return out;
};

/* ---------- HPC / systems ---------- */

const grid: Renderer = (r, accent) => {
  let out = "";
  const cols = 28, rows = 13, cw = SW / cols, ch = SH / rows;
  const srcs = Array.from({ length: 3 }, () => [between(r, 0.1, 0.9), between(r, 0.1, 0.9), between(r, 0.6, 1.2)]);
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const u = (i + 0.5) / cols, v = (j + 0.5) / rows;
      let val = 0;
      for (const [sx, sy, s] of srcs) val += Math.exp(-((u - sx) ** 2 + (v - sy) ** 2) / (0.08 * s));
      val = Math.min(1, val);
      out += rect(S.x0 + i * cw + 2, S.y0 + j * ch + 2, cw - 4, ch - 4, `rx="3" fill="${val > 0.5 ? accent : INK}" fill-opacity="${f(0.06 + val * 0.9)}"`);
    }
  for (const [sx, sy] of srcs) {
    const cx = S.x0 + sx * SW, cy = S.y0 + sy * SH;
    for (let k = 1; k <= 3; k++) out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${k * 70}" ry="${k * 44}" fill="none" stroke="${PAPER}" stroke-opacity="0.9" stroke-width="2"/>`;
  }
  // MPI rank boundaries
  for (let k = 1; k < 4; k++) out += line(S.x0 + (SW / 4) * k, S.y0, S.x0 + (SW / 4) * k, S.y1, `stroke="${PAPER}" stroke-width="6"`) + text(S.x0 + (SW / 4) * (k - 1) + 12, S.y0 + 28, `rank ${k - 1}`, `font-size="16" fill="${PAPER}"`);
  out += text(S.x0 + (SW / 4) * 3 + 12, S.y0 + 28, "rank 3", `font-size="16" fill="${PAPER}"`);
  return out;
};

/** Stack of FITS frames turning into an HDF5 tensor (maketensor). */
const frames: Renderer = (r, accent) => {
  let out = "";
  // FITS frames stack
  for (let k = 4; k >= 0; k--) {
    const x = S.x0 + 40 + k * 26, y = S.y0 + 200 - k * 26;
    out += rect(x, y, 420, 360, `rx="6" fill="${INK}" stroke="${PAPER}" stroke-width="2"`);
    if (k === 0) {
      for (let i = 0; i < 120; i++) out += circle(x + between(r, 10, 410), y + between(r, 10, 350), between(r, 0.8, 2.6), `fill="${PAPER}" fill-opacity="${f(between(r, 0.4, 1))}"`);
      out += circle(x + 250, y + 170, 4, `fill="${accent}"`) + rect(x + 228, y + 148, 44, 44, `fill="none" stroke="${accent}" stroke-width="2"`);
    }
  }
  out += text(S.x0 + 40, S.y0 + 600, "FITS  ·  difference images  ·  T frames", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  out += `<path d="M${S.x0 + 620} ${CY} L${S.x0 + 740} ${CY}" stroke="${accent}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`;
  // tensor cube (isometric)
  const tx = S.x0 + 1000, ty = CY + 120, n = 6, c = 46;
  for (let z = n - 1; z >= 0; z--)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (z > 0 && i < n - 1 && j > 0) continue; // only visible faces
        const x = tx + (i - j) * c * 0.87, y = ty + (i + j) * c * 0.5 - z * c;
        const v = between(r, 0.1, 0.9);
        out += `<path d="M${f(x)} ${f(y)} l${c * 0.87} ${c * 0.5} l0 ${-c} l${-c * 0.87} ${-c * 0.5} Z" fill="${accent}" fill-opacity="${f(v)}" stroke="${PAPER}" stroke-width="1"/>`;
        out += `<path d="M${f(x)} ${f(y)} l${-c * 0.87} ${c * 0.5} l0 ${-c} l${c * 0.87} ${-c * 0.5} Z" fill="${INK}" fill-opacity="${f(v * 0.8)}" stroke="${PAPER}" stroke-width="1"/>`;
        out += `<path d="M${f(x)} ${f(y - c)} l${c * 0.87} ${c * 0.5} l${-c * 0.87} ${c * 0.5} l${-c * 0.87} ${-c * 0.5} Z" fill="${mix(accent, PAPER, 0.5)}" fill-opacity="${f(v)}" stroke="${PAPER}" stroke-width="1"/>`;
      }
  out += text(S.x0 + 800, S.y0 + 600, "HDF5 shards  ·  (T, 3, H, W)  +  injected TNOs", `font-size="15" letter-spacing="3" fill="${MUTED}"`);
  return out;
};

const renderers = {
  // category defaults
  neural, segmentation, chat, circuit, pcb, path: pathMotif, ledger, grid,
  // project-specific
  galaxy, svm, tree, outliers, sequence, matrix, spectrogram, motor, mosaic, lesion, bins,
  roadscene, fabric, retina, stereo, traffic, exam, agents, pipeline, datapath, fsm, accelerator,
  cacheblocks, particles, eggs, ecg, meter, pid, am, linetrack, follow, face, frames,
} satisfies Record<string, Renderer>;

export type MotifName = keyof typeof renderers;

/** Per-project motif assignment. Anything not listed uses its category motif. */
const motifBySlug: Record<string, MotifName> = {
  "fpga-unet-accelerator": "accelerator",
  "pipelined-risc-v": "pipeline",
  "exam-generator-rag": "exam",
  "fabric-defect-detection": "fabric",
  "driving-scene-segmentation": "roadscene",
  "smart-energy-monitor": "pcb",
  "tno-detection": "galaxy",
  cashflow: "ledger",
  skinsense: "lesion",
  recyclevision: "bins",
  "cifar100-wideresnet": "mosaic",
  "outfit-classifier": "mosaic",
  "banknote-svm": "svm",
  shroomsafe: "tree",
  carddefender: "outliers",
  sentimentflow: "sequence",
  breastnet: "neural",
  "movie-recommender": "matrix",
  "music-genre-classifier": "spectrogram",
  "induction-motor-fault-detection": "motor",
  "retina-vessel-segmentation": "retina",
  "stereo-depth-estimation": "stereo",
  "vehicle-detection": "traffic",
  "ai-agents-workshop": "agents",
  "techstore-chatbot": "chat",
  "fyp-ai-accelerator": "circuit",
  "single-cycle-risc-v": "datapath",
  "car-security-system": "fsm",
  "cache-simulator": "cacheblocks",
  "aqi-monitoring": "particles",
  "egg-incubator": "eggs",
  "health-tracker": "ecg",
  "electricity-theft-detection": "meter",
  "ball-balancing-pid": "pid",
  "am-superheterodyne": "am",
  "obstacle-avoiding-robot": "path",
  "line-following-robot": "linetrack",
  "human-following-robot": "follow",
  "verre-optics": "face",
  "laplace-solver": "grid",
  maketensor: "frames",
};

// ─────────────────────────── page ───────────────────────────

function svgFor(p: Project): string {
  const cat = categoryById[p.category];
  const motif: MotifName = motifBySlug[p.slug] ?? (p.motif as MotifName | undefined) ?? cat.motif;
  const accent = p.accent ?? cat.hue;
  const r = rng(hash(p.slug));
  const art = renderers[motif](r, accent);
  const metric = p.metrics?.[0];
  const showMetric = metric && metric.value.length <= 7;
  const label = `${cat.label.toUpperCase()}  ·  ${p.year}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)} thumbnail">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.06"/></feComponentTransfer>
    </filter>
    <clipPath id="safe"><rect x="${S.x0 - 40}" y="${S.y0 - 40}" width="${SW + 80}" height="${SH + 120}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <g clip-path="url(#safe)">${art}</g>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.7"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="90" y="104" font-family="${MONO}" font-size="24" letter-spacing="4" fill="${MUTED}">${esc(label)}</text>
  <circle cx="${W - 100}" cy="96" r="10" fill="${accent}"/>
  ${
    showMetric
      ? `<rect x="${W - 90 - metric.value.length * 82 - 30}" y="${H - 220}" width="${metric.value.length * 82 + 60}" height="180" fill="${PAPER}" fill-opacity="0.82" rx="8"/>
  <text x="${W - 90}" y="${H - 96}" text-anchor="end" font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="500" fill="${INK}" letter-spacing="-6">${esc(metric.value)}</text>
  <text x="${W - 92}" y="${H - 58}" text-anchor="end" font-family="${MONO}" font-size="22" letter-spacing="3" fill="${MUTED}">${esc(metric.label.toUpperCase())}</text>`
      : ""
  }
</svg>
`;
}

const outDir = join(process.cwd(), "public", "thumbnails");
mkdirSync(outDir, { recursive: true });
let n = 0;
const used = new Map<string, number>();
for (const p of projects) {
  writeFileSync(join(outDir, `${p.slug}.svg`), svgFor(p));
  const m = motifBySlug[p.slug] ?? categoryById[p.category].motif;
  used.set(m, (used.get(m) ?? 0) + 1);
  n++;
}
console.log(`wrote ${n} thumbnails to ${outDir}`);
console.log("motifs used:", [...used.entries()].map(([k, v]) => `${k}×${v}`).join(", "));
