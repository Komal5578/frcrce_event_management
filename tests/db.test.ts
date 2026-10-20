import { beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { codeOf, freshDb, mkUser } from "./helpers/sqlite";

let db: DatabaseSync, C1: string, S1: string, S2: string, S3: string;
const V1 = "v1", V2 = "v2";
let seq = 0;
const t = (h: number) => `2030-01-01T${String(h).padStart(2, "0")}:00:00.000Z`;

beforeEach(() => {
  db = freshDb();
  C1 = mkUser(db, "coordinator"); S1 = mkUser(db, "student"); S2 = mkUser(db, "student"); S3 = mkUser(db, "student");
  db.exec(`INSERT INTO venues (id, name, capacity) VALUES ('${V1}','V1',100), ('${V2}','V2',100)`);
});

function ev(o: { venue?: string; h1?: number; h2?: number; status?: string; cap?: number } = {}) {
  const id = `e${++seq}`;
  db.prepare("INSERT INTO events (id, title, coordinator_id, venue_id, starts_at, ends_at, capacity, status) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, "E", C1, o.venue ?? V1, t(o.h1 ?? 10), t(o.h2 ?? 12), o.cap ?? 10, o.status ?? "open");
  return id;
}
const q = (sql: string, ...a: any[]) => db.prepare(sql).run(...a); // eslint-disable-line @typescript-eslint/no-explicit-any
const reg = (e: string, u: string, status = "confirmed") =>
  q("INSERT INTO registrations (id, event_id, user_id, status, created_at) VALUES (?,?,?,?,?)", `r${++seq}`, e, u, status, `2030-01-01T00:00:${String(seq % 60).padStart(2, "0")}.000Z`);
const st = (e: string, u: string) => (db.prepare("SELECT status s FROM registrations WHERE event_id=? AND user_id=?").get(e, u) as { s: string }).s;

describe("clash", () => {
  it("rejects overlapping active events in one venue, insert and update paths", () => {
    ev({ h1: 10, h2: 12 });
    expect(codeOf(() => ev({ h1: 11, h2: 13, status: "pending" }))).toContain("VENUE_CLASH");
    expect(codeOf(() => ev({ h1: 9, h2: 11, status: "approved" }))).toContain("VENUE_CLASH");
    const d = ev({ h1: 20, h2: 21, status: "approved" });
    expect(codeOf(() => q("UPDATE events SET starts_at=?, ends_at=? WHERE id=?", t(11), t(13), d))).toContain("VENUE_CLASH");
    expect(codeOf(() => q("UPDATE events SET venue_id=? WHERE id=?", V1, ev({ h1: 11, h2: 12, venue: V2 })))).toContain("VENUE_CLASH");
  });
  it("accepts back-to-back and other-venue slots", () => {
    ev({ h1: 10, h2: 12 }); ev({ h1: 12, h2: 14 }); ev({ h1: 10, h2: 12, venue: V2 });
  });
  it("draft, returned, cancelled and completed do not block", () => {
    ev({ h1: 10, h2: 12 });
    for (const s of ["draft", "returned", "cancelled", "completed"]) ev({ h1: 10, h2: 12, status: s });
  });
  it("cannot reopen a cancelled event into a taken slot", () => {
    ev({ h1: 10, h2: 12 });
    const e = ev({ h1: 10, h2: 12, status: "cancelled" });
    // cancelled -> open is not an allowed move, but the clash guard must also hold on its own
    expect(codeOf(() => q("UPDATE events SET status='open' WHERE id=?", e))).toMatch(/VENUE_CLASH|BAD_STATE/);
  });
  it("check constraints: time order, ISO format, complete unless draft", () => {
    expect(codeOf(() => ev({ h1: 16, h2: 15 }))).toContain("CHECK");
    expect(codeOf(() => q("INSERT INTO events (id,title,coordinator_id,venue_id,starts_at,ends_at,capacity,status) VALUES ('bad','E',?,?,?,?,5,'open')",
      C1, V1, "2030-01-01 10:00", "2030-01-01 11:00"))).toContain("CHECK");
    expect(codeOf(() => q("INSERT INTO events (id,title,coordinator_id,status) VALUES ('inc','E',?,'pending')", C1))).toContain("CHECK");
    q("INSERT INTO events (id,title,coordinator_id,status) VALUES ('dr','E',?,'draft')", C1);
  });
});

describe("registration", () => {
  it("rejects a second row for the same user and event, even if cancelled", () => {
    const e = ev();
    reg(e, S1, "cancelled");
    expect(codeOf(() => reg(e, S1))).toContain("UNIQUE constraint failed: registrations.event_id, registrations.user_id");
  });
  it("upsert registers last seat as confirmed then waitlisted, re-register after cancel reuses the row", () => {
    const e = ev({ cap: 1 });
    const up = db.prepare(`INSERT INTO registrations (id, event_id, user_id, status, created_at)
      SELECT ?1, e.id, ?2, CASE WHEN (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status='confirmed') < e.capacity
        THEN 'confirmed' ELSE 'waitlisted' END, strftime('%Y-%m-%dT%H:%M:%fZ','now')
      FROM events e WHERE e.id = ?3 AND e.status = 'open'
      ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status, created_at = excluded.created_at
        WHERE registrations.status = 'cancelled'`);
    expect(up.run("a", S1, e).changes).toBe(1);
    expect(up.run("b", S2, e).changes).toBe(1);
    expect(st(e, S1)).toBe("confirmed"); expect(st(e, S2)).toBe("waitlisted");
    expect(up.run("c", S1, e).changes).toBe(0); // already registered
    q("UPDATE registrations SET status='cancelled' WHERE event_id=? AND user_id=?", e, S1);
    expect(st(e, S2)).toBe("confirmed"); // promoted
    expect(up.run("d", S1, e).changes).toBe(1);
    expect(st(e, S1)).toBe("waitlisted");
    expect(db.prepare("SELECT count(*) n FROM registrations WHERE event_id=? AND user_id=?").get(e, S1)).toEqual({ n: 1 });
  });
  it("capacity backstop aborts EVENT_FULL", () => {
    const e = ev({ cap: 1 });
    reg(e, S1);
    expect(codeOf(() => reg(e, S2))).toContain("EVENT_FULL");
    reg(e, S2, "waitlisted");
    q("UPDATE registrations SET status='cancelled' WHERE user_id=? AND event_id=?", S1, e);
    reg(e, S3, "waitlisted");
    expect(st(e, S2)).toBe("confirmed");
    expect(codeOf(() => q("UPDATE registrations SET status='confirmed' WHERE user_id=? AND event_id=?", S3, e))).toContain("EVENT_FULL");
  });
  it("cancelling a confirmed registration promotes the oldest waitlisted and notifies once", () => {
    const e = ev({ cap: 1 });
    reg(e, S1); reg(e, S2, "waitlisted"); reg(e, S3, "waitlisted");
    q("UPDATE registrations SET status='cancelled' WHERE user_id=? AND event_id=?", S1, e);
    expect(st(e, S2)).toBe("confirmed"); expect(st(e, S3)).toBe("waitlisted");
    const n = db.prepare("SELECT user_id FROM notifications WHERE kind='waitlist_promoted' AND event_id=?").all(e);
    expect(n).toEqual([{ user_id: S2 }]);
  });
});

describe("allocation", () => {
  it("over-allocating a resource for overlapping events aborts RESOURCE_SHORT", () => {
    db.exec("INSERT INTO resources (id, name, quantity) VALUES ('R','Proj',3)");
    const e1 = ev({ h1: 14, h2: 16 }), e2 = ev({ h1: 15, h2: 17, venue: V2 }), e3 = ev({ h1: 17, h2: 19 });
    q("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('a1',?,'R',2)", e1);
    expect(codeOf(() => q("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('a2',?,'R',2)", e2))).toContain("RESOURCE_SHORT");
    q("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('a3',?,'R',3)", e3); // back-to-back
    q("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('a2',?,'R',1)", e2);
    expect(codeOf(() => q("UPDATE resource_allocations SET quantity=2 WHERE id='a2'"))).toContain("RESOURCE_SHORT");
  });
});

describe("transition", () => {
  it("impossible status moves abort BAD_STATE, allowed ones pass, updated_at is bumped", () => {
    const e = ev({ status: "completed" });
    expect(codeOf(() => q("UPDATE events SET status='open' WHERE id=?", e))).toContain("BAD_STATE");
    const p = ev({ h1: 1, h2: 2, status: "pending" });
    for (const s of ["approved", "open", "ongoing", "completed"]) q("UPDATE events SET status=? WHERE id=?", s, p);
    const d = ev({ h1: 3, h2: 4, status: "approved" });
    q("UPDATE events SET status='cancelled' WHERE id=?", d);
    expect(codeOf(() => q("UPDATE events SET status='pending' WHERE id=?", d))).toContain("BAD_STATE");
    q("UPDATE events SET updated_at='2020-01-01T00:00:00.000Z' WHERE id=?", d);
    q("UPDATE events SET title='x' WHERE id=?", d);
    expect((db.prepare("SELECT updated_at u FROM events WHERE id=?").get(d) as { u: string }).u > "2020-01-01T00:00:00.000Z").toBe(true);
  });
});
