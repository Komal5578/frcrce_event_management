import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
const tokens = new Map<string, string>();
for (const m of css.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) tokens.set(m[1], m[2]);

const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function color(name: string) {
  if (name === "white") return "#FFFFFF";
  const v = tokens.get(name);
  if (!v) throw new Error(`Token --color-${name} missing from app/globals.css`);
  return v;
}

const rows: { pair: string; ratio: string; needed: number }[] = [];
function check(fg: string, bg: string, needed: number) {
  const r = ratio(color(fg), color(bg));
  rows.push({ pair: `${fg} on ${bg}`, ratio: r.toFixed(2), needed });
  expect(r, `${fg} on ${bg} = ${r.toFixed(2)}, needs ${needed}`).toBeGreaterThanOrEqual(needed);
}

describe("contrast (WCAG 2.2 AA)", () => {
  it("text pairs >= 4.5", () => {
    for (const [fg, bg] of [
      ["ink", "surface"], ["ink", "panel"], ["muted", "surface"], ["muted", "panel"],
      ["white", "accent"], ["accent", "surface"], ["white", "destructive"],
    ]) check(fg, bg, 4.5);
  });

  it("UI border on surface >= 3 (1.4.11)", () => check("border-ui", "surface", 3));

  it("every status fg on its bg >= 4.5", () => {
    const keys = [...tokens.keys()].filter((k) => /^status-.+-fg$/.test(k)).map((k) => k.slice(7, -3));
    expect(keys.length).toBeGreaterThanOrEqual(9);
    for (const k of keys) check(`status-${k}-fg`, `status-${k}-bg`, 4.5);
  });

  it("helper rejects a bad pair", () => {
    expect(ratio("#777777", "#FFFFFF")).toBeLessThan(4.5);
  });

  afterAll(() => console.table(rows));
});
