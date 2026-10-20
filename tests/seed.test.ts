import { beforeAll, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { freshDb } from "./helpers/sqlite";

describe("seed", () => {
  let db: DatabaseSync;
  const rows = <T>(sql: string) => db.prepare(sql).all() as T[];
  beforeAll(() => { db = freshDb({ seed: true }); });

  it("has 1 admin, 2 coordinators, 4 students and one organizer", () => {
    const r = rows<{ role: string; n: number }>("SELECT role, count(*) n FROM profiles GROUP BY role");
    expect(Object.fromEntries(r.map((x) => [x.role, x.n]))).toEqual({ admin: 1, coordinator: 2, student: 4 });
    expect(rows<{ n: number }>("SELECT count(*) n FROM profiles WHERE is_organizer = 1")[0].n).toBe(1);
  });
  it("every demo user has a distinct PBKDF2 hash that verifies the demo password", () => {
    const p = rows<{ email: string; password_hash: string }>("SELECT email, password_hash FROM profiles");
    expect(p.length).toBe(7);
    const salts = new Set<string>();
    for (const { password_hash } of p) {
      const m = /^pbkdf2-sha256\$(\d+)\$([A-Za-z0-9+/]+=*)\$([A-Za-z0-9+/]+=*)$/.exec(password_hash);
      expect(m).not.toBeNull();
      const [, iter, salt, hash] = m!;
      expect(Number(iter)).toBeLessThanOrEqual(100000);
      salts.add(salt);
      const got = pbkdf2Sync("demo-password-2026", Buffer.from(salt, "base64"), Number(iter), 32, "sha256");
      expect(timingSafeEqual(got, Buffer.from(hash, "base64"))).toBe(true);
    }
    expect(salts.size).toBe(7);
    for (const e of ["coordinator", "coordinator2", "student", "karan", "meera", "dev", "admin"])
      expect(p.map((x) => x.email)).toContain(`${e}@demo.college.test`);
  });
  it("covers every stored event status", () => {
    const s = rows<{ status: string }>("SELECT DISTINCT status FROM events").map((x) => x.status).sort();
    expect(s).toEqual(["approved", "cancelled", "completed", "draft", "ongoing", "open", "pending", "returned"]);
  });
  it("has a full open event with one waitlisted and an overdue task", () => {
    const f = rows(`SELECT e.capacity cap, sum(r.status='confirmed') c, sum(r.status='waitlisted') w
      FROM events e JOIN registrations r ON r.event_id = e.id WHERE e.status='open' GROUP BY e.id HAVING e.capacity = 2`);
    expect(f).toEqual([{ cap: 2, c: 2, w: 1 }]);
    expect(rows<{ n: number }>("SELECT count(*) n FROM tasks WHERE status <> 'done' AND due_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')")[0].n).toBeGreaterThan(0);
  });
  it("bookings never overlap within a venue", () => {
    expect(rows(`SELECT 1 FROM bookings a JOIN bookings b ON a.venue_id = b.venue_id AND a.event_id < b.event_id
      AND a.starts_at < b.ends_at AND b.starts_at < a.ends_at`)).toEqual([]);
  });
});
