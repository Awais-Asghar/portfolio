/**
 * Generates one deterministic SVG thumbnail per project into public/thumbnails/.
 *
 *   npm run thumbs
 *
 * Every thumbnail is 1600x1000 on paper, drawn with a category motif and a
 * seeded PRNG (seed = project slug) so re-running produces identical files.
 * The card component overlays the title in real web fonts, so the SVG only
 * carries art, a small category label and (optionally) one headline metric.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { categoryById, type Motif } from "../src/data/categories";
import { projects, type Project } from "../src/data/projects";

const W = 1600;
const H = 1000;
const PAPER = "#FAF8F3";
const INK = "#141416";
const MUTED = "#6B6B70";
const RULE = "#D9D4C9";

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

// ─────────────────────────── motifs ───────────────────────────
// Each motif draws inside the safe area x:[90,1510] y:[150,820].

const SAFE = { x0: 90, y0: 150, x1: 1510, y1: 820 };

function neural(r: R, accent: string): string {
  const layers = 4 + Math.floor(r() * 2);
  const cols: { x: number; y: number }[][] = [];
  const gapX = (SAFE.x1 - SAFE.x0) / (layers - 1);
  for (let l = 0; l < layers; l++) {
    const n = 3 + Math.floor(r() * 5);
    const col: { x: number; y: number }[] = [];
    const span = Math.min(SAFE.y1 - SAFE.y0, n * 110);
    const top = (SAFE.y0 + SAFE.y1) / 2 - span / 2;
    for (let i = 0; i < n; i++) {
      col.push({
        x: SAFE.x0 + l * gapX + between(r, -30, 30),
        y: top + (n === 1 ? span / 2 : (i * span) / (n - 1)) + between(r, -18, 18),
      });
    }
    cols.push(col);
  }
  let out = "";
  for (let l = 0; l < layers - 1; l++) {
    for (const a of cols[l]) {
      for (const b of cols[l + 1]) {
        if (r() < 0.35) continue;
        const w = between(r, 0.6, 3.2);
        const strong = w > 2.4;
        const cx = (a.x + b.x) / 2 + between(r, -40, 40);
        out += `<path d="M${f(a.x)} ${f(a.y)} C ${f(cx)} ${f(a.y)}, ${f(cx)} ${f(b.y)}, ${f(b.x)} ${f(b.y)}" stroke="${strong ? accent : INK}" stroke-opacity="${strong ? 0.75 : 0.18}" stroke-width="${f(w)}" fill="none"/>`;
      }
    }
  }
  for (let l = 0; l < layers; l++) {
    for (const p of cols[l]) {
      const hot = r() < 0.28;
      const rad = hot ? between(r, 16, 24) : between(r, 9, 15);
      out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(rad)}" fill="${hot ? accent : PAPER}" stroke="${hot ? accent : INK}" stroke-width="${hot ? 0 : 2.5}"/>`;
      if (hot)
        out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(rad + 12)}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>`;
    }
  }
  return out;
}

function segmentation(r: R, accent: string): string {
  let out = "";
  // faint pixel grid
  for (let x = SAFE.x0; x <= SAFE.x1; x += 40)
    out += `<line x1="${x}" y1="${SAFE.y0}" x2="${x}" y2="${SAFE.y1}" stroke="${INK}" stroke-opacity="0.05"/>`;
  for (let y = SAFE.y0; y <= SAFE.y1; y += 40)
    out += `<line x1="${SAFE.x0}" y1="${y}" x2="${SAFE.x1}" y2="${y}" stroke="${INK}" stroke-opacity="0.05"/>`;
  const palette = [accent, mix(accent, "#FFFFFF", 0.45), mix(accent, INK, 0.35), "#7A5C1E", "#4E6B2F"];
  const blobs = 5 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const cx = between(r, SAFE.x0 + 150, SAFE.x1 - 150);
    const cy = between(r, SAFE.y0 + 120, SAFE.y1 - 120);
    const rx = between(r, 110, 260);
    const ry = between(r, 80, 190);
    const pts = 9 + Math.floor(r() * 5);
    let d = "";
    for (let k = 0; k < pts; k++) {
      const ang = (k / pts) * Math.PI * 2;
      const wob = between(r, 0.72, 1.18);
      const x = cx + Math.cos(ang) * rx * wob;
      const y = cy + Math.sin(ang) * ry * wob;
      d += (k === 0 ? "M" : "L") + `${f(x)} ${f(y)} `;
    }
    d += "Z";
    const col = palette[i % palette.length];
    out += `<path d="${d}" fill="${col}" fill-opacity="${f(between(r, 0.28, 0.55))}" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  // two bounding boxes with tag labels
  for (let i = 0; i < 2; i++) {
    const x = between(r, SAFE.x0 + 40, SAFE.x1 - 420);
    const y = between(r, SAFE.y0 + 40, SAFE.y1 - 280);
    const w = between(r, 240, 380);
    const h = between(r, 160, 240);
    out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="14 10"/>`;
    out += `<rect x="${f(x)}" y="${f(y - 34)}" width="118" height="34" fill="${INK}"/>`;
    out += `<text x="${f(x + 12)}" y="${f(y - 11)}" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="19" fill="${PAPER}">obj ${(0.86 + r() * 0.13).toFixed(2)}</text>`;
  }
  return out;
}

function chat(r: R, accent: string): string {
  let out = "";
  // document chunks on the left
  let y = SAFE.y0 + 10;
  for (let i = 0; i < 4; i++) {
    const h = between(r, 100, 150);
    out += `<rect x="${SAFE.x0}" y="${f(y)}" width="420" height="${f(h)}" rx="10" fill="${PAPER}" stroke="${RULE}" stroke-width="3"/>`;
    for (let k = 0; k < Math.floor(h / 26) - 1; k++) {
      const w = between(r, 180, 370);
      out += `<line x1="${SAFE.x0 + 26}" y1="${f(y + 30 + k * 26)}" x2="${f(SAFE.x0 + 26 + w)}" y2="${f(y + 30 + k * 26)}" stroke="${INK}" stroke-opacity="${i === 1 ? 0.5 : 0.18}" stroke-width="6" stroke-linecap="round"/>`;
    }
    if (i === 1)
      out += `<rect x="${SAFE.x0 - 6}" y="${f(y - 6)}" width="432" height="${f(h + 12)}" rx="14" fill="none" stroke="${accent}" stroke-width="4"/>`;
    y += h + 26;
  }
  // arrow to bubbles
  out += `<path d="M${SAFE.x0 + 440} ${f(SAFE.y0 + 250)} C ${SAFE.x0 + 560} ${f(SAFE.y0 + 250)}, ${SAFE.x0 + 560} ${f(SAFE.y0 + 330)}, ${SAFE.x0 + 640} ${f(SAFE.y0 + 330)}" stroke="${accent}" stroke-width="4" fill="none" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  // chat bubbles on the right
  const bx0 = SAFE.x0 + 680;
  let by = SAFE.y0 + 20;
  for (let i = 0; i < 4; i++) {
    const mine = i % 2 === 1;
    const w = between(r, 320, 600);
    const h = between(r, 80, 130);
    const x = mine ? SAFE.x1 - w : bx0;
    out += `<rect x="${f(x)}" y="${f(by)}" width="${f(w)}" height="${f(h)}" rx="26" fill="${mine ? accent : PAPER}" fill-opacity="${mine ? 0.92 : 1}" stroke="${mine ? accent : INK}" stroke-opacity="${mine ? 1 : 0.5}" stroke-width="3"/>`;
    const lines = Math.max(1, Math.floor(h / 30) - 1);
    for (let k = 0; k < lines; k++) {
      const lw = between(r, w * 0.4, w - 60);
      out += `<line x1="${f(x + 30)}" y1="${f(by + 32 + k * 28)}" x2="${f(x + 30 + lw)}" y2="${f(by + 32 + k * 28)}" stroke="${mine ? PAPER : INK}" stroke-opacity="${mine ? 0.85 : 0.25}" stroke-width="7" stroke-linecap="round"/>`;
    }
    by += h + 28;
  }
  // typing dots
  out += `<circle cx="${bx0 + 34}" cy="${f(by + 30)}" r="8" fill="${INK}" fill-opacity="0.35"/><circle cx="${bx0 + 64}" cy="${f(by + 30)}" r="8" fill="${INK}" fill-opacity="0.55"/><circle cx="${bx0 + 94}" cy="${f(by + 30)}" r="8" fill="${INK}" fill-opacity="0.85"/>`;
  return out;
}

function circuit(r: R, accent: string): string {
  let out = "";
  const g = 40;
  // chips
  const chips: { x: number; y: number; w: number; h: number }[] = [];
  const nChips = 2 + Math.floor(r() * 2);
  for (let i = 0; i < nChips; i++) {
    const w = g * (4 + Math.floor(r() * 4));
    const h = g * (3 + Math.floor(r() * 3));
    const x = SAFE.x0 + g * Math.floor(between(r, 1, (SAFE.x1 - SAFE.x0) / g - w / g - 1));
    const y = SAFE.y0 + g * Math.floor(between(r, 1, (SAFE.y1 - SAFE.y0) / g - h / g - 1));
    chips.push({ x, y, w, h });
  }
  // traces: orthogonal random walks on the grid
  const traces = 26 + Math.floor(r() * 10);
  for (let i = 0; i < traces; i++) {
    let x = SAFE.x0 + g * Math.floor(between(r, 0, (SAFE.x1 - SAFE.x0) / g));
    let y = SAFE.y0 + g * Math.floor(between(r, 0, (SAFE.y1 - SAFE.y0) / g));
    let d = `M${x} ${y}`;
    const steps = 3 + Math.floor(r() * 6);
    let horiz = r() < 0.5;
    for (let s = 0; s < steps; s++) {
      const len = g * (1 + Math.floor(r() * 5)) * (r() < 0.5 ? -1 : 1);
      if (horiz) x = Math.max(SAFE.x0, Math.min(SAFE.x1, x + len));
      else y = Math.max(SAFE.y0, Math.min(SAFE.y1, y + len));
      d += ` L${x} ${y}`;
      horiz = !horiz;
    }
    const hot = r() < 0.22;
    out += `<path d="${d}" fill="none" stroke="${hot ? accent : INK}" stroke-opacity="${hot ? 0.9 : 0.28}" stroke-width="${hot ? 5 : 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
    out += `<circle cx="${x}" cy="${y}" r="${hot ? 9 : 6}" fill="${PAPER}" stroke="${hot ? accent : INK}" stroke-opacity="${hot ? 1 : 0.5}" stroke-width="3"/>`;
  }
  for (const c of chips) {
    out += `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
    out += `<rect x="${c.x + 14}" y="${c.y + 14}" width="${c.w - 28}" height="${c.h - 28}" rx="3" fill="${INK}" fill-opacity="0.9"/>`;
    out += `<circle cx="${c.x + 30}" cy="${c.y + 30}" r="6" fill="${accent}"/>`;
    for (let px = c.x + g / 2; px < c.x + c.w; px += g) {
      out += `<line x1="${px}" y1="${c.y - 14}" x2="${px}" y2="${c.y}" stroke="${INK}" stroke-width="4"/><line x1="${px}" y1="${c.y + c.h}" x2="${px}" y2="${c.y + c.h + 14}" stroke="${INK}" stroke-width="4"/>`;
    }
  }
  // clock waveform along the bottom
  let d = `M${SAFE.x0} ${SAFE.y1 + 60}`;
  let lvl = 1;
  for (let x = SAFE.x0; x < SAFE.x1; x += 38) {
    d += ` L${x} ${SAFE.y1 + 60 - lvl * 26} L${x + 38} ${SAFE.y1 + 60 - lvl * 26}`;
    lvl = 1 - lvl;
  }
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linejoin="round"/>`;
  return out;
}

function pcb(r: R, accent: string): string {
  let out = "";
  // board outline
  out += `<rect x="${SAFE.x0}" y="${SAFE.y0}" width="${SAFE.x1 - SAFE.x0}" height="${SAFE.y1 - SAFE.y0}" rx="28" fill="${tint(accent, 0.06)}" stroke="${INK}" stroke-width="4"/>`;
  for (const [cx, cy] of [
    [SAFE.x0 + 44, SAFE.y0 + 44],
    [SAFE.x1 - 44, SAFE.y0 + 44],
    [SAFE.x0 + 44, SAFE.y1 - 44],
    [SAFE.x1 - 44, SAFE.y1 - 44],
  ])
    out += `<circle cx="${cx}" cy="${cy}" r="16" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
  // MCU
  const mx = SAFE.x0 + 160;
  const my = SAFE.y0 + 150;
  out += `<rect x="${mx}" y="${my}" width="260" height="260" rx="10" fill="${INK}"/>`;
  out += `<circle cx="${mx + 34}" cy="${my + 34}" r="9" fill="${PAPER}" fill-opacity="0.7"/>`;
  for (let i = 0; i < 9; i++) {
    const p = mx + 30 + i * 25;
    out += `<rect x="${p}" y="${my - 26}" width="10" height="26" fill="${INK}"/><rect x="${p}" y="${my + 260}" width="10" height="26" fill="${INK}"/>`;
    const q = my + 30 + i * 25;
    out += `<rect x="${mx - 26}" y="${q}" width="26" height="10" fill="${INK}"/><rect x="${mx + 260}" y="${q}" width="26" height="10" fill="${INK}"/>`;
  }
  // passive components
  for (let i = 0; i < 14; i++) {
    const x = between(r, SAFE.x0 + 480, SAFE.x1 - 120);
    const y = between(r, SAFE.y0 + 60, SAFE.y1 - 260);
    const vert = r() < 0.5;
    out += `<rect x="${f(x)}" y="${f(y)}" width="${vert ? 22 : 60}" height="${vert ? 60 : 22}" rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
  }
  // traces
  for (let i = 0; i < 18; i++) {
    const x0 = mx + 286;
    const y0 = my + 30 + (i % 9) * 25 + 5;
    const x1 = between(r, SAFE.x0 + 520, SAFE.x1 - 100);
    const y1 = between(r, SAFE.y0 + 60, SAFE.y1 - 250);
    out += `<path d="M${x0} ${y0} L${f(x1 - 60)} ${y0} L${f(x1)} ${f(y1)}" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="3" stroke-linejoin="round"/><circle cx="${f(x1)}" cy="${f(y1)}" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
  }
  // current waveform at the bottom
  let d = "";
  const base = SAFE.y1 - 120;
  for (let x = SAFE.x0 + 60; x <= SAFE.x1 - 60; x += 6) {
    const t = (x - SAFE.x0) / 140;
    const y = base + Math.sin(t * Math.PI) * 60 * (0.7 + 0.3 * Math.sin(t * 0.9));
    d += (d ? " L" : "M") + `${x} ${f(y)}`;
  }
  out += `<line x1="${SAFE.x0 + 60}" y1="${base}" x2="${SAFE.x1 - 60}" y2="${base}" stroke="${INK}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 8"/>`;
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  // packet ticks
  for (let i = 0; i < 24; i++) {
    const x = SAFE.x0 + 60 + i * 58;
    const on = r() < 0.6;
    out += `<rect x="${x}" y="${SAFE.y1 - 40}" width="40" height="14" fill="${on ? accent : INK}" fill-opacity="${on ? 0.9 : 0.15}"/>`;
  }
  return out;
}

function pathMotif(r: R, accent: string): string {
  let out = "";
  // floor tiles
  for (let x = SAFE.x0; x <= SAFE.x1; x += 70)
    out += `<line x1="${x}" y1="${SAFE.y0}" x2="${x}" y2="${SAFE.y1}" stroke="${INK}" stroke-opacity="0.06"/>`;
  for (let y = SAFE.y0; y <= SAFE.y1; y += 70)
    out += `<line x1="${SAFE.x0}" y1="${y}" x2="${SAFE.x1}" y2="${y}" stroke="${INK}" stroke-opacity="0.06"/>`;
  // obstacles
  const obs: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const x = between(r, SAFE.x0 + 120, SAFE.x1 - 200);
    const y = between(r, SAFE.y0 + 80, SAFE.y1 - 160);
    const w = between(r, 70, 150);
    const h = between(r, 60, 120);
    obs.push([x, y, w, h]);
    out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${INK}" fill-opacity="0.12" stroke="${INK}" stroke-width="3"/>`;
    out += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + w)}" y2="${f(y + h)}" stroke="${INK}" stroke-opacity="0.35" stroke-width="2"/>`;
  }
  // path: smooth bezier through waypoints
  const pts: number[][] = [[SAFE.x0 + 40, SAFE.y1 - 80]];
  const n = 5;
  for (let i = 1; i <= n; i++) {
    pts.push([SAFE.x0 + ((SAFE.x1 - SAFE.x0) * i) / n - between(r, 0, 80), between(r, SAFE.y0 + 80, SAFE.y1 - 80)]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const cx = (px + x) / 2;
    d += ` C ${f(cx)} ${f(py)}, ${f(cx)} ${f(y)}, ${f(x)} ${f(y)}`;
  }
  out += `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="0.2" stroke-width="26" stroke-linecap="round"/>`;
  out += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="22 16" stroke-linecap="round"/>`;
  // robot at the last waypoint with ultrasonic arcs
  const [rx, ry] = pts[pts.length - 1];
  out += `<rect x="${f(rx - 40)}" y="${f(ry - 30)}" width="80" height="60" rx="10" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
  out += `<rect x="${f(rx - 48)}" y="${f(ry - 22)}" width="10" height="20" fill="${INK}"/><rect x="${f(rx + 38)}" y="${f(ry - 22)}" width="10" height="20" fill="${INK}"/><rect x="${f(rx - 48)}" y="${f(ry + 4)}" width="10" height="20" fill="${INK}"/><rect x="${f(rx + 38)}" y="${f(ry + 4)}" width="10" height="20" fill="${INK}"/>`;
  for (let k = 1; k <= 4; k++) {
    const rad = 50 + k * 34;
    out += `<path d="M${f(rx + rad * Math.cos(-0.55))} ${f(ry - 30 + rad * Math.sin(-0.55))} A ${rad} ${rad} 0 0 0 ${f(rx + rad * Math.cos(-2.59))} ${f(ry - 30 + rad * Math.sin(-2.59))}" fill="none" stroke="${accent}" stroke-opacity="${f(1 - k * 0.2)}" stroke-width="3"/>`;
  }
  // waypoint markers
  for (const [x, y] of pts.slice(0, -1))
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="8" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
  return out;
}

function ledger(r: R, accent: string): string {
  let out = "";
  const rows = 9;
  const rowH = (SAFE.y1 - SAFE.y0) / rows;
  const hi = Math.floor(r() * rows);
  for (let i = 0; i < rows; i++) {
    const y = SAFE.y0 + i * rowH;
    if (i === hi)
      out += `<rect x="${SAFE.x0 - 20}" y="${f(y)}" width="${SAFE.x1 - SAFE.x0 + 40}" height="${f(rowH)}" fill="${tint(accent, 0.1)}"/>`;
    out += `<line x1="${SAFE.x0}" y1="${f(y + rowH)}" x2="${SAFE.x1}" y2="${f(y + rowH)}" stroke="${RULE}" stroke-width="2.5"/>`;
    // date + vendor lines
    out += `<rect x="${SAFE.x0}" y="${f(y + rowH / 2 - 8)}" width="90" height="16" rx="4" fill="${INK}" fill-opacity="0.22"/>`;
    out += `<rect x="${SAFE.x0 + 130}" y="${f(y + rowH / 2 - 9)}" width="${f(between(r, 180, 420))}" height="18" rx="4" fill="${INK}" fill-opacity="${i === hi ? 0.8 : 0.4}"/>`;
    // category pill
    out += `<rect x="${SAFE.x0 + 640}" y="${f(y + rowH / 2 - 14)}" width="${f(between(r, 90, 160))}" height="28" rx="14" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="2"/>`;
    // amount bar, right aligned
    const w = between(r, 60, 380);
    const neg = r() < 0.55;
    out += `<rect x="${f(SAFE.x1 - w)}" y="${f(y + rowH / 2 - 10)}" width="${f(w)}" height="20" rx="3" fill="${neg ? INK : accent}" fill-opacity="${neg ? 0.28 : 0.9}"/>`;
  }
  // total rule
  out += `<line x1="${SAFE.x0}" y1="${SAFE.y1 + 30}" x2="${SAFE.x1}" y2="${SAFE.y1 + 30}" stroke="${INK}" stroke-width="4"/><line x1="${SAFE.x0}" y1="${SAFE.y1 + 40}" x2="${SAFE.x1}" y2="${SAFE.y1 + 40}" stroke="${INK}" stroke-width="1.5"/>`;
  return out;
}

function grid(r: R, accent: string): string {
  let out = "";
  const cols = 28;
  const rows = 13;
  const cw = (SAFE.x1 - SAFE.x0) / cols;
  const ch = (SAFE.y1 - SAFE.y0) / rows;
  // smooth scalar field: sum of a few gaussians (Laplace-like)
  const srcs = Array.from({ length: 3 }, () => [between(r, 0.1, 0.9), between(r, 0.1, 0.9), between(r, 0.6, 1.2)]);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const u = (i + 0.5) / cols;
      const v = (j + 0.5) / rows;
      let val = 0;
      for (const [sx, sy, s] of srcs) val += Math.exp(-((u - sx) ** 2 + (v - sy) ** 2) / (0.08 * s));
      val = Math.min(1, val);
      const x = SAFE.x0 + i * cw;
      const y = SAFE.y0 + j * ch;
      out += `<rect x="${f(x + 2)}" y="${f(y + 2)}" width="${f(cw - 4)}" height="${f(ch - 4)}" rx="3" fill="${val > 0.5 ? accent : INK}" fill-opacity="${f(0.06 + val * 0.9)}"/>`;
    }
  }
  // contour-ish rings over the peaks
  for (const [sx, sy] of srcs) {
    const cx = SAFE.x0 + sx * (SAFE.x1 - SAFE.x0);
    const cy = SAFE.y0 + sy * (SAFE.y1 - SAFE.y0);
    for (let k = 1; k <= 3; k++)
      out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${k * 70}" ry="${k * 44}" fill="none" stroke="${PAPER}" stroke-opacity="0.9" stroke-width="2"/>`;
  }
  return out;
}

const renderers: Record<Motif, (r: R, accent: string) => string> = {
  neural,
  segmentation,
  chat,
  circuit,
  pcb,
  path: pathMotif,
  ledger,
  grid,
};

// ─────────────────────────── page ───────────────────────────

function svgFor(p: Project): string {
  const cat = categoryById[p.category];
  const motif = p.motif ?? cat.motif;
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
    <clipPath id="safe"><rect x="${SAFE.x0 - 40}" y="${SAFE.y0 - 40}" width="${SAFE.x1 - SAFE.x0 + 80}" height="${SAFE.y1 - SAFE.y0 + 120}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <g clip-path="url(#safe)">${art}</g>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.7"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="90" y="104" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="24" letter-spacing="4" fill="${MUTED}">${esc(label)}</text>
  <circle cx="${W - 100}" cy="96" r="10" fill="${accent}"/>
  ${
    showMetric
      ? `<text x="${W - 90}" y="${H - 96}" text-anchor="end" font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="500" fill="${INK}" letter-spacing="-6">${esc(metric.value)}</text>
  <text x="${W - 92}" y="${H - 58}" text-anchor="end" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="22" letter-spacing="3" fill="${MUTED}">${esc(metric.label.toUpperCase())}</text>`
      : ""
  }
</svg>
`;
}

const outDir = join(process.cwd(), "public", "thumbnails");
mkdirSync(outDir, { recursive: true });
let n = 0;
for (const p of projects) {
  writeFileSync(join(outDir, `${p.slug}.svg`), svgFor(p));
  n++;
}
console.log(`wrote ${n} thumbnails to ${outDir}`);
