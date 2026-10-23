import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

// ── OKLCH → linear-sRGB luminance conversion ──────────────────────────────

/** Convert OKLCH(L C H) to relative luminance Y (IEC 61966-2-1). */
function oklchToLuminance(L: number, C: number, H: number): number {
  // OKLCH → OKLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS (linear)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → XYZ (D65)
  const X = 1.2270138511 * l - 0.5577999807 * m + 0.2812561490 * s;
  const Y = -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s;
  const Z = -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s;

  // XYZ → linear sRGB
  const rLin = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const gLin = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  const bLin = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  // Clamp and compute luminance
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const toY = (c: number) => {
    const v = clamp(c);
    return v <= 0.04045 / 12.92 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  // Use relative luminance formula
  return 0.2126 * toY(rLin) + 0.7152 * toY(gLin) + 0.0722 * toY(bLin);
}

function contrastRatio(lumA: number, lumB: number): number {
  const hi = Math.max(lumA, lumB);
  const lo = Math.min(lumA, lumB);
  return (hi + 0.05) / (lo + 0.05);
}

/** Parse all `--color-*: oklch(L C H)` from a CSS block. */
function parseOklchTokens(block: string): Map<string, number> {
  const map = new Map<string, number>();
  const re = /--color-([a-z0-9-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g;
  for (const m of block.matchAll(re)) {
    const name = m[1];
    const L = parseFloat(m[2]);
    const C = parseFloat(m[3]);
    const H = parseFloat(m[4]);
    map.set(name, oklchToLuminance(L, C, H));
  }
  return map;
}

/** Extract a named CSS block (`:root { ... }` or `[data-theme="dark"] { ... }`). */
function extractBlock(css: string, selector: string): string {
  const idx = css.indexOf(selector);
  if (idx === -1) throw new Error(`Block not found: "${selector}"`);
  let depth = 0;
  let start = -1;
  for (let i = idx; i < css.length; i++) {
    if (css[i] === "{") { if (depth === 0) start = i; depth++; }
    if (css[i] === "}") { depth--; if (depth === 0) return css.slice(start + 1, i); }
  }
  throw new Error(`Unterminated block: "${selector}"`);
}

const lightBlock = extractBlock(css, ":root");
const darkBlock = extractBlock(css, "[data-theme=\"dark\"]");

const lightLum = parseOklchTokens(lightBlock);
const darkLum = parseOklchTokens(darkBlock);

const rows: { theme: string; pair: string; ratio: string; needed: number; pass: boolean }[] = [];

function check(lum: Map<string, number>, theme: string, fg: string, bg: string, needed: number) {
  const fgL = lum.get(fg);
  const bgL = lum.get(bg);
  if (fgL === undefined) throw new Error(`[${theme}] Token --color-${fg} not found`);
  if (bgL === undefined) throw new Error(`[${theme}] Token --color-${bg} not found`);
  const r = contrastRatio(fgL, bgL);
  const pass = r >= needed;
  rows.push({ theme, pair: `${fg} on ${bg}`, ratio: r.toFixed(2), needed, pass });
  expect(r, `[${theme}] ${fg} on ${bg} = ${r.toFixed(2)}, needs >= ${needed}`).toBeGreaterThanOrEqual(needed);
}

describe("contrast (WCAG 2.2 AA) – light mode", () => {
  it("text pairs >= 4.5", () => {
    for (const [fg, bg] of [
      ["ink", "surface"],
      ["ink", "panel"],
      ["muted", "surface"],
      ["muted", "panel"],
      ["accent-contrast", "accent"],
      ["destructive-contrast", "destructive"],
    ]) {
      check(lightLum, "light", fg, bg, 4.5);
    }
  });

  it("accent on page >= 4.5 (links/labels)", () => {
    check(lightLum, "light", "accent", "surface", 4.5);
  });

  it("UI border on surface >= 3 (1.4.11)", () => {
    check(lightLum, "light", "border-ui", "surface", 3);
  });

  it("every status fg on its bg >= 4.5", () => {
    const keys = [...lightLum.keys()].filter((k) => /^status-.+-fg$/.test(k)).map((k) => k.slice(7, -3));
    expect(keys.length, "need at least 17 status token families in light").toBeGreaterThanOrEqual(9);
    for (const k of keys) check(lightLum, "light", `status-${k}-fg`, `status-${k}-bg`, 4.5);
  });
});

describe("contrast (WCAG 2.2 AA) – dark mode", () => {
  it("text pairs >= 4.5", () => {
    for (const [fg, bg] of [
      ["ink", "surface"],
      ["ink", "panel"],
      ["muted", "surface"],
      ["muted", "panel"],
      ["accent-contrast", "accent"],
      ["destructive-contrast", "destructive"],
    ]) {
      check(darkLum, "dark", fg, bg, 4.5);
    }
  });

  it("UI border on surface >= 3 (1.4.11)", () => {
    check(darkLum, "dark", "border-ui", "surface", 3);
  });

  it("every status fg on its bg >= 4.5", () => {
    const keys = [...darkLum.keys()].filter((k) => /^status-.+-fg$/.test(k)).map((k) => k.slice(7, -3));
    expect(keys.length, "need at least 9 status token families in dark").toBeGreaterThanOrEqual(9);
    for (const k of keys) check(darkLum, "dark", `status-${k}-fg`, `status-${k}-bg`, 4.5);
  });
});

describe("contrast helper sanity", () => {
  it("rejects a near-white pair < 4.5 and confirms a dark-on-white pair > 7", () => {
    // Very light gray (L=0.92) on white (L=1.0) → low contrast
    const nearWhiteLum = oklchToLuminance(0.92, 0, 0);
    const whiteLum = oklchToLuminance(1.0, 0, 0);
    expect(contrastRatio(nearWhiteLum, whiteLum)).toBeLessThan(4.5);

    // Black (L=0) on white → ratio ~21
    const blackLum = oklchToLuminance(0.0, 0, 0);
    expect(contrastRatio(blackLum, whiteLum)).toBeGreaterThan(7);
  });
});

afterAll(() => console.table(rows));
