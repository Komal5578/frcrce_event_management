import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BACKEND = fileURLToPath(new URL("../../../backend/", import.meta.url));

export function freshDb({ seed = false } = {}) {
  const db = new DatabaseSync(":memory:"); // foreign_keys on by default
  for (const f of readdirSync(BACKEND + "migrations/v1-sqlite").filter((f) => f.endsWith(".sql")).sort())
    db.exec(readFileSync(`${BACKEND}migrations/v1-sqlite/${f}`, "utf8"));
  if (seed) db.exec(readFileSync(BACKEND + "seed/v1-sqlite/seed.sql", "utf8"));
  return db;
}

/** Thrown message of fn, or null if it did not throw. */
export function codeOf(fn: () => unknown): string | null {
  try { fn(); return null; } catch (e) { return (e as Error).message; }
}

let n = 0;
export function mkUser(db: DatabaseSync, role: string, name = `User${++n}`) {
  const id = `u-${role}-${++n}`;
  db.prepare("INSERT INTO profiles (id, email, password_hash, name, role) VALUES (?,?,?,?,?)")
    .run(id, `${id}@test.local`, "x", name, role);
  return id;
}

// ponytail: test-only, just the D1 methods the domain layer uses (prepare/bind/run/first/all/batch).
export function d1Shim(db: DatabaseSync) {
  const make = (sql: string, args: SQLInputValue[] = []) => {
    const exec = () => {
      const s = db.prepare(sql);
      const r = s.columns().length ? s.all(...args) : (s.run(...args), []);
      return { results: r as Record<string, unknown>[], meta: { changes: Number(db.prepare("SELECT changes() c").get()!.c) } };
    };
    return {
      bind: (...a: SQLInputValue[]) => make(sql, a),
      run: async () => exec(),
      all: async () => exec(),
      first: async () => exec().results[0] ?? null,
      _exec: exec,
    };
  };
  return {
    prepare: (sql: string) => make(sql),
    batch: async (stmts: ReturnType<typeof make>[]) => {
      db.exec("BEGIN");
      try { const out = stmts.map((s) => s._exec()); db.exec("COMMIT"); return out; }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  };
}
