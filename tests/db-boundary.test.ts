import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    if (f === "node_modules" || f === ".next" || f === ".open-next") return [];
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}
// strip comments so header prose cannot trip the check
const code = (p: string) => readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const dbAllowed = (p: string) => p === "lib/db.ts" || p.startsWith("lib/domain/") || p === "lib/session.ts" || p === "lib/auth.ts";

describe("only lib touches the D1 binding (replaces 'RLS on every table')", () => {
  const files = ["app", "components", "lib"].flatMap((d) => { try { return walk(d); } catch { return []; } });
  it("finds files to check", () => expect(files.length).toBeGreaterThan(0));
  it("@/lib/db and getDb are imported only by lib/domain, session, auth", () => {
    const bad = files.filter((p) => !dbAllowed(p) && /@\/lib\/db|\bgetDb\b/.test(code(p)));
    expect(bad).toEqual([]);
  });
  it("getCloudflareContext only in lib/db.ts", () => {
    const bad = files.filter((p) => p !== "lib/db.ts" && /getCloudflareContext/.test(code(p)));
    expect(bad).toEqual([]);
  });
  it("no interpolated SQL in lib", () => {
    const bad = files.filter((p) => p.startsWith("lib/") && /prepare\(`[^`]*\$\{/.test(code(p)));
    expect(bad).toEqual([]);
  });
});
