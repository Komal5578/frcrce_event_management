import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { freshDb, d1Shim } from "./helpers/sqlite";

let db = freshDb({ seed: true });
const jar = new Map<string, string>();
const redirect = vi.fn((to: string) => { throw new Error(`REDIRECT:${to}`); });
let demoFlag: string | undefined = "true";

vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined),
    set: (k: string, v: string) => void jar.set(k, v),
    delete: (k: string) => void jar.delete(k),
  }),
}));
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db), getEnv: () => ({ DEMO_LOGIN: demoFlag }) }));

const { homeFor, parseRole, demoEmail, isDemoEnabled, ROLES, requireRole } = await import("@/lib/auth");
const { hashPassword, verifyPassword } = await import("@/lib/password");
const { createSession, readSession, deleteSession, hashToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } = await import("@/lib/session");
const { signIn, demoLogin, signOut } = await import("@/app/login/actions");

const PW = "demo-password-2026";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const redirected = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as Error).message; } };

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

beforeEach(() => { db = freshDb({ seed: true }); jar.clear(); demoFlag = "true"; redirect.mockClear(); });

describe("auth helpers", () => {
  it("homeFor maps roles to fixed paths", () => {
    expect(ROLES.map(homeFor)).toEqual(["/coordinator", "/student", "/admin"]);
  });
  it("parseRole is a strict whitelist", () => {
    for (const r of ROLES) expect(parseRole(r)).toBe(r);
    for (const bad of ["Admin", "", undefined, null, "../evil", 1]) expect(parseRole(bad)).toBeNull();
  });
  it("demo emails exist in seed.sql", () => {
    const seed = readFileSync(fileURLToPath(new URL("../../backend/seed/v1-sqlite/seed.sql", import.meta.url)), "utf8");
    for (const r of ROLES) expect(seed).toContain(`'${demoEmail(r)}'`);
  });
  it("isDemoEnabled is strictly 'true'", () => {
    expect(isDemoEnabled({ DEMO_LOGIN: "true" })).toBe(true);
    for (const v of ["false", undefined, "TRUE", "1"]) expect(isDemoEnabled({ DEMO_LOGIN: v })).toBe(false);
  });
});

describe("password", () => {
  it("round-trips, rejects wrong and malformed, never throws", async () => {
    const h = await hashPassword("s3cret");
    expect(h).toMatch(/^pbkdf2-sha256\$100000\$/);
    expect(await verifyPassword("s3cret", h)).toBe(true);
    expect(await verifyPassword("nope", h)).toBe(false);
    for (const bad of ["", "x", "pbkdf2-sha256$100000$abc", "pbkdf2-sha256$0$a$b", "pbkdf2-sha256$NaN$a$b", h.slice(0, -6)])
      expect(await verifyPassword("s3cret", bad)).toBe(false);
  });
  it("accepts the seed hashes", async () => {
    const rows = db.prepare("SELECT password_hash h FROM profiles").all() as { h: string }[];
    expect(rows.length).toBe(7);
    for (const r of rows) expect(await verifyPassword(PW, r.h)).toBe(true);
  });
});

describe("session", () => {
  it("stores only the hash, 7 day expiry, and reads back", async () => {
    const uid = "a0000000-0000-0000-0000-000000000001";
    await createSession(uid);
    const token = jar.get(SESSION_COOKIE)!;
    expect(token.length).toBeGreaterThanOrEqual(43);
    const row = db.prepare("SELECT * FROM sessions").get() as { token_hash: string; expires_at: string };
    expect(row.token_hash).toBe(await hashToken(token));
    expect(row.token_hash).not.toBe(token);
    const days = (Date.parse(row.expires_at) - Date.now()) / 864e5;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThan(7.01);
    expect(await readSession()).toMatchObject({ id: uid, role: "coordinator" });
    await deleteSession();
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(db.prepare("SELECT count(*) c FROM sessions").get()).toEqual({ c: 0 });
  });
  it("tokens are unique; unknown and expired are null", async () => {
    const uid = "a0000000-0000-0000-0000-000000000001";
    await createSession(uid);
    const t1 = jar.get(SESSION_COOKIE);
    await createSession(uid);
    expect(jar.get(SESSION_COOKIE)).not.toBe(t1);
    jar.set(SESSION_COOKIE, "unknown");
    expect(await readSession()).toBeNull();
    db.prepare("UPDATE sessions SET expires_at='2000-01-01T00:00:00.000Z'").run();
    jar.set(SESSION_COOKIE, t1!);
    expect(await readSession()).toBeNull();
  });
  it("cookie options", () => {
    expect(SESSION_COOKIE_OPTIONS(false)).toEqual({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 604800, secure: false });
    expect(SESSION_COOKIE_OPTIONS(true).secure).toBe(true);
  });
  it("requireRole redirects by session", async () => {
    expect(await redirected(requireRole("admin"))).toBe("REDIRECT:/login");
    await createSession("a0000000-0000-0000-0000-000000000001");
    expect(await redirected(requireRole("admin"))).toBe("REDIRECT:/coordinator");
    expect((await requireRole("coordinator")).role).toBe("coordinator");
  });
});

describe("login actions", () => {
  it("password sign-in lands in role home and sets a session", async () => {
    expect(await redirected(signIn({}, fd({ email: "Admin@demo.college.test", password: PW })))).toBe("REDIRECT:/admin");
    expect(jar.has(SESSION_COOKIE)).toBe(true);
  });
  it("wrong password and unknown user give the same generic error", async () => {
    const a = await signIn({}, fd({ email: "admin@demo.college.test", password: "bad" }));
    const b = await signIn({}, fd({ email: "nobody@x.test", password: "bad" }));
    expect(a.error).toBeTruthy();
    expect(a).toEqual(b);
    expect(jar.size).toBe(0);
  });
  it("demo login works only when flag is exactly 'true'", async () => {
    expect(await redirected(demoLogin({}, fd({ role: "student" })))).toBe("REDIRECT:/student");
    jar.clear();
    for (const v of ["false", undefined, "TRUE"]) {
      demoFlag = v;
      expect((await demoLogin({}, fd({ role: "student" }))).error).toBeTruthy();
    }
    demoFlag = "true";
    expect((await demoLogin({}, fd({ role: "root" }))).error).toBeTruthy();
    expect(jar.size).toBe(0);
  });
  it("signOut deletes row and cookie", async () => {
    await demoLogin({}, fd({ role: "student" })).catch(() => {});
    expect(await redirected(signOut())).toBe("REDIRECT:/login");
    expect(jar.size).toBe(0);
    expect(db.prepare("SELECT count(*) c FROM sessions").get()).toEqual({ c: 0 });
  });
});

describe("secret hygiene", () => {
  it("no NEXT_PUBLIC_DEMO_* anywhere in app, components, lib", () => {
    for (const f of [...walk("app"), ...walk("components"), ...walk("lib")]) {
      const s = readFileSync(f, "utf8");
      expect(s, f).not.toContain("NEXT_PUBLIC_DEMO_PASSWORD");
      expect(s, f).not.toContain("NEXT_PUBLIC_DEMO_LOGIN");
    }
  });
  it("no supabase left in source or package.json", () => {
    for (const f of [...walk("app"), ...walk("components"), ...walk("lib"), "package.json"])
      expect(readFileSync(f, "utf8").toLowerCase(), f).not.toContain("supabase");
  });
});
