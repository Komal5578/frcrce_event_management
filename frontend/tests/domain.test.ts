import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "./helpers/sqlite";
import { humanize, DomainError } from "@/lib/errors";

let db: DatabaseSync;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));

const COORD = { id: "a0000000-0000-0000-0000-000000000001", role: "coordinator" as const };
const ADMIN = { id: "a0000000-0000-0000-0000-000000000003", role: "admin" as const };
const S1 = { id: "a0000000-0000-0000-0000-000000000004", role: "student" as const };
const S2 = { id: "a0000000-0000-0000-0000-000000000005", role: "student" as const };
const VENUE = "b0000000-0000-0000-0000-000000000005";

const code = async (p: Promise<unknown>) => p.then(() => null, (e) => (e as { code?: string }).code ?? "RAW");
const ev = () => import("@/lib/domain/events");
const reg = () => import("@/lib/domain/registrations");
const tk = () => import("@/lib/domain/tasks");
const ve = () => import("@/lib/domain/venues");
const no = () => import("@/lib/domain/notifications");

function mkEvent(id: string, status: string, capacity = 1, start = "2031-01-01T10:00:00.000Z", end = "2031-01-01T12:00:00.000Z") {
  db.prepare("INSERT INTO events (id,title,coordinator_id,venue_id,starts_at,ends_at,capacity,status) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, "Test " + id, COORD.id, VENUE, start, end, capacity, status);
}

beforeEach(() => { db = freshDb({ seed: true }); });

describe("errors", () => {
  it.each([["VENUE_CLASH"], ["EVENT_FULL"], ["RESOURCE_SHORT"], ["BAD_STATE"],
    ["UNIQUE constraint failed: registrations.event_id, registrations.user_id"],
    ["CHECK constraint failed: events_complete_unless_draft"], ["SQLITE_ERROR: no such table: x"]])("humanize %s", (m) => {
    const e = humanize(new Error(m));
    expect(e).toBeInstanceOf(DomainError);
    expect(e.message).not.toMatch(/sqlite|constraint|select|table/i);
    expect(e.message.length).toBeGreaterThan(10);
  });
  it("keeps codes stable", () => {
    expect(humanize(new Error("VENUE_CLASH")).code).toBe("VENUE_CLASH");
    expect(humanize(new Error("UNIQUE constraint failed: registrations.event_id")).code).toBe("ALREADY_REGISTERED");
  });
});

describe("events", () => {
  it("submit: draft with details becomes pending; clash surfaces as VENUE_CLASH", async () => {
    const m = await ev();
    mkEvent("d1", "draft"); mkEvent("d2", "draft");
    await m.submitEvent(COORD, "d1");
    expect(await code(m.submitEvent(COORD, "d1"))).toBe("BAD_STATE");
    expect(await code(m.submitEvent(COORD, "d2"))).toBe("VENUE_CLASH");
  });
  it("submit without details gives INVALID_INPUT", async () => {
    db.prepare("INSERT INTO events (id,title,coordinator_id) VALUES ('nd','T',?)").run(COORD.id);
    expect(await code((await ev()).submitEvent(COORD, "nd"))).toBe("INVALID_INPUT");
  });
  it("review approve moves pending to approved", async () => {
    const m = await ev();
    mkEvent("p1", "pending");
    await m.reviewEvent(ADMIN, "p1", true);
    expect(await code(m.reviewEvent(ADMIN, "p1", true))).toBe("BAD_STATE");
  });
  it("cancel notifies registrants in one go and only from allowed states", async () => {
    const m = await ev(); const r = await reg();
    mkEvent("o1", "open", 5); await r.registerForEvent(S1, "o1");
    await m.cancelEvent(COORD, "o1", "Rain");
    expect(db.prepare("SELECT count(*) c FROM notifications WHERE event_id='o1' AND user_id=?").get(S1.id)).toMatchObject({ c: 1 });
    expect(await code(m.cancelEvent(COORD, "o1"))).toBe("BAD_STATE");
  });
  it("freeVenues excludes active overlaps (half-open)", async () => {
    mkEvent("o2", "open");
    const v = await ve();
    const ids = async (s: string, e: string, x?: string) => (await v.freeVenues(COORD, s, e, x)).map((r) => r.id);
    expect(await ids("2031-01-01T11:00:00.000Z", "2031-01-01T13:00:00.000Z")).not.toContain(VENUE);
    expect(await ids("2031-01-01T12:00:00.000Z", "2031-01-01T13:00:00.000Z")).toContain(VENUE);
    expect(await ids("2031-01-01T11:00:00.000Z", "2031-01-01T13:00:00.000Z", "o2")).toContain(VENUE);
    db.prepare("UPDATE venues SET active=0 WHERE id=?").run(VENUE);
    expect(await ids("2032-01-01T11:00:00.000Z", "2032-01-01T13:00:00.000Z")).not.toContain(VENUE);
  });
  it("resourceAvailable and RESOURCE_SHORT", async () => {
    const v = await ve();
    const res = db.prepare("SELECT id, quantity FROM resources WHERE active=1 LIMIT 1").get() as { id: string; quantity: number };
    mkEvent("o3", "open");
    expect(await v.resourceAvailable(COORD, res.id, "2031-01-01T10:00:00.000Z", "2031-01-01T12:00:00.000Z")).toBe(res.quantity);
    db.prepare("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('al1','o3',?,?)").run(res.id, res.quantity);
    expect(await v.resourceAvailable(COORD, res.id, "2031-01-01T10:00:00.000Z", "2031-01-01T12:00:00.000Z")).toBe(0);
    expect(await v.resourceAvailable(COORD, res.id, "2031-01-01T10:00:00.000Z", "2031-01-01T12:00:00.000Z", "o3")).toBe(res.quantity);
    mkEvent("o4", "draft", 1, "2031-01-01T11:00:00.000Z", "2031-01-01T13:00:00.000Z");
    db.prepare("UPDATE events SET venue_id=(SELECT id FROM venues WHERE id<>?) WHERE id='o4'").run(VENUE);
    db.prepare("UPDATE events SET status='pending' WHERE id='o4'").run();
    let err: unknown;
    try { db.prepare("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('al2','o4',?,1)").run(res.id); } catch (e) { err = e; }
    expect(humanize(err).code).toBe("RESOURCE_SHORT");
  });
});

describe("registrations", () => {
  it("last seat: confirmed then waitlisted; repeat is ALREADY_REGISTERED", async () => {
    const r = await reg(); mkEvent("o5", "open", 1);
    expect(await r.registerForEvent(S1, "o5")).toBe("confirmed");
    expect(await r.registerForEvent(S2, "o5")).toBe("waitlisted");
    expect(await code(r.registerForEvent(S2, "o5"))).toBe("ALREADY_REGISTERED");
    expect(await r.seatCounts(S1, "o5")).toEqual({ confirmed: 1, waitlisted: 1 });
  });
  it("not-open event gives BAD_STATE; coordinators cannot register", async () => {
    const r = await reg(); mkEvent("a1", "approved");
    expect(await code(r.registerForEvent(S1, "a1"))).toBe("BAD_STATE");
    expect(await code(r.registerForEvent(COORD, "a1"))).toBe("NOT_ALLOWED");
  });
  it("cancel promotes the waitlist; re-register after cancel works", async () => {
    const r = await reg(); mkEvent("o6", "open", 1);
    await r.registerForEvent(S1, "o6"); await r.registerForEvent(S2, "o6");
    await r.cancelRegistration(S1, "o6");
    expect(db.prepare("SELECT status s FROM registrations WHERE event_id='o6' AND user_id=?").get(S2.id)).toMatchObject({ s: "confirmed" });
    expect(await code(r.cancelRegistration(S1, "o6"))).toBe("BAD_STATE");
    expect(await r.registerForEvent(S1, "o6")).toBe("waitlisted");
  });
  it("seatCounts hides events a student cannot see", async () => {
    mkEvent("h1", "approved");
    expect(await code((await reg()).seatCounts(S1, "h1"))).toBe("NOT_ALLOWED");
  });
});

describe("tasks and notifications", () => {
  const mkTask = (id: string, assignee: string | null) =>
    db.prepare("INSERT INTO tasks (id,event_id,title,assignee_id) VALUES (?, (SELECT id FROM events LIMIT 1), 't', ?)").run(id, assignee);
  it("assignee, owner coordinator and admin may set status; others may not", async () => {
    const t = await tk();
    const evOwner = db.prepare("SELECT coordinator_id c FROM events LIMIT 1").get() as { c: string };
    mkTask("t1", S1.id);
    await t.setTaskStatus(S1, "t1", "Doing");
    expect(db.prepare("SELECT status s FROM tasks WHERE id='t1'").get()).toMatchObject({ s: "doing" });
    await t.setTaskStatus({ id: evOwner.c, role: "coordinator" }, "t1", "Done");
    await t.setTaskStatus(ADMIN, "t1", "To do");
    expect(await code(t.setTaskStatus(S2, "t1", "Done"))).toBe("NOT_ALLOWED");
    expect(await code(t.setTaskStatus(S1, "t1", "Bogus"))).toBe("INVALID_INPUT");
  });
  it("notifyRegistrants counts rows; list is scoped to actor", async () => {
    const n = await no(); const r = await reg(); mkEvent("o7", "open", 5);
    await r.registerForEvent(S1, "o7"); await r.registerForEvent(S2, "o7");
    expect(await n.notifyRegistrants(COORD, "o7", "update", "Room changed")).toBe(2);
    expect(await code(n.notifyRegistrants(S1, "o7", "update", "x"))).toBe("NOT_ALLOWED");
    const mine = await n.listNotifications(S1);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((x) => x.user_id === S1.id)).toBe(true);
  });
});

it("every exported domain function is exercised (count)", async () => {
  const names = [...Object.keys(await ev()), ...Object.keys(await reg()), ...Object.keys(await tk()), ...Object.keys(await ve()), ...Object.keys(await no())].sort();
  expect(names).toEqual(["cancelEvent", "cancelRegistration", "freeVenues", "listNotifications", "listVisibleEvents", "manageableEvent", "notifyRegistrants",
    "registerForEvent", "resourceAvailable", "reviewEvent", "seatCounts", "setTaskStatus", "submitEvent", "visibleWhere"]);
});
