import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "./helpers/sqlite";

let db: DatabaseSync;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));

const COORD = { id: "a0000000-0000-0000-0000-000000000001", role: "coordinator" as const };
const COORD2 = { id: "a0000000-0000-0000-0000-000000000002", role: "coordinator" as const };
const ADMIN = { id: "a0000000-0000-0000-0000-000000000003", role: "admin" as const };
const S1 = { id: "a0000000-0000-0000-0000-000000000004", role: "student" as const };
const S2 = { id: "a0000000-0000-0000-0000-000000000005", role: "student" as const };
const S3 = { id: "a0000000-0000-0000-0000-000000000006", role: "student" as const };
const VENUE = "b0000000-0000-0000-0000-000000000005";
const E = (n: number) => `e0000000-0000-0000-0000-00000000000${n}`;
const TPL = "d0000000-0000-0000-0000-000000000001";

const code = async (p: Promise<unknown>) => p.then(() => null, (e) => (e as { code?: string }).code ?? "RAW");
const msg = async (p: Promise<unknown>) => p.then(() => "", (e) => (e as Error).message);
const NO_SQL = /sqlite|constraint|trigger|select/i;
const dr = () => import("@/lib/domain/drafts");
const ca = () => import("@/lib/domain/catalog");
const al = () => import("@/lib/domain/allocations");
const pe = () => import("@/lib/domain/people");
const vw = () => import("@/lib/domain/views");
const ad = () => import("@/lib/domain/admin");
const reg = () => import("@/lib/domain/registrations");

function mkEvent(id: string, status: string, capacity = 1, start = "2031-01-01T10:00:00.000Z", end = "2031-01-01T12:00:00.000Z", venue = VENUE) {
  db.prepare("INSERT INTO events (id,title,coordinator_id,venue_id,starts_at,ends_at,capacity,status) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, "Test " + id, COORD.id, venue, start, end, capacity, status);
}
const row = (id: string) => db.prepare("SELECT * FROM events WHERE id = ?").get(id) as Record<string, unknown>;

beforeEach(() => { db = freshDb({ seed: true }); });

describe("drafts", () => {
  it("listTemplates returns the 3 seeded templates by name; students refused", async () => {
    const m = await dr();
    expect((await m.listTemplates(COORD)).map((t) => t.name)).toEqual(["Cultural Night", "Guest Lecture", "Workshop"]);
    expect(await code(m.listTemplates(S1))).toBe("NOT_ALLOWED");
  });
  it("createDraft prefills from template and coordinator department", async () => {
    const m = await dr();
    const id = await m.createDraft(COORD, TPL);
    expect(row(id)).toMatchObject({ title: "Workshop - Computer Science", type: "workshop", capacity: 40, department: "Computer Science", status: "draft", coordinator_id: COORD.id });
    expect(row(await m.createDraft(COORD, null))).toMatchObject({ title: "Untitled event", status: "draft" });
    expect(await code(m.createDraft(COORD, "nope"))).toBe("INVALID_INPUT");
    expect(await code(m.createDraft(S1, null))).toBe("NOT_ALLOWED");
    expect(await code(m.createDraft(ADMIN, null))).toBe("NOT_ALLOWED");
  });
  it("saveDraft patches only supplied fields; works on draft and returned", async () => {
    const m = await dr();
    await m.saveDraft(COORD, E(1), { capacity: 50, venueId: VENUE });
    expect(row(E(1))).toMatchObject({ capacity: 50, venue_id: VENUE, title: "Intro to Git (draft)", type: "workshop" });
    await m.saveDraft(COORD, E(1), { description: null });
    expect(row(E(1))).toMatchObject({ description: null, capacity: 50 });
    await m.saveDraft(COORD2, E(9), { capacity: 30 });
    expect(row(E(9))).toMatchObject({ capacity: 30, status: "returned" });
  });
  it("saveDraft authorization and state", async () => {
    const m = await dr();
    expect(await code(m.saveDraft(COORD2, E(1), { capacity: 5 }))).toBe("NOT_ALLOWED");
    expect(await code(m.saveDraft(S1, E(1), { capacity: 5 }))).toBe("NOT_ALLOWED");
    expect(await code(m.saveDraft(ADMIN, E(1), { capacity: 5 }))).toBe("NOT_ALLOWED");
    expect(await code(m.saveDraft(COORD2, E(2), { capacity: 5 }))).toBe("BAD_STATE");
  });
  it("saveDraft validation gives human text", async () => {
    const m = await dr();
    const cases: [object, RegExp?][] = [
      [{ title: "  " }], [{ title: "x".repeat(121) }], [{ capacity: 0 }], [{ capacity: 1.5 }],
      [{ startsAt: "2031-01-01 10:00" }], [{ startsAt: "2031-02-30T10:00:00.000Z" }],
      [{ startsAt: "2031-01-01T12:00:00.000Z", endsAt: "2031-01-01T10:00:00.000Z" }],
      [{ venueId: "nope" }], [{ venueId: "b0000000-0000-0000-0000-000000000006" }],
    ];
    for (const [p] of cases) {
      const t = await msg(m.saveDraft(COORD, E(1), p));
      expect(await code(m.saveDraft(COORD, E(1), p))).toBe("INVALID_INPUT");
      expect(t.length).toBeGreaterThan(10);
      expect(t).not.toMatch(NO_SQL);
    }
  });
  it("saveDraft ignores status and owner keys", async () => {
    const m = await dr();
    await m.saveDraft(COORD, E(1), { capacity: 9, status: "open", coordinator_id: COORD2.id, return_reason: "x", cancel_reason: "y" } as never);
    expect(row(E(1))).toMatchObject({ status: "draft", coordinator_id: COORD.id, return_reason: null, cancel_reason: null, capacity: 9 });
  });
  it("updateEvent edits live events and notifies registrants in the batch", async () => {
    const m = await dr(); const r = await reg();
    mkEvent("o1", "open", 5);
    await r.registerForEvent(S1, "o1"); await r.registerForEvent(S2, "o1");
    const out = await m.updateEvent(COORD, "o1", { startsAt: "2031-01-01T11:00:00.000Z", endsAt: "2031-01-01T13:00:00.000Z" });
    expect(out).toEqual({ notified: 2 });
    expect(row("o1")).toMatchObject({ status: "open", starts_at: "2031-01-01T11:00:00.000Z" });
    expect(db.prepare("SELECT count(*) c FROM notifications WHERE event_id='o1' AND kind='event_changed'").get()).toMatchObject({ c: 2 });
    expect(await m.updateEvent(COORD, "o1", {})).toEqual({ notified: 0 });
    expect(await m.updateEvent(COORD, E(3), { title: "Renamed workshop" })).toEqual({ notified: 0 });
    expect(row(E(3))).toMatchObject({ title: "Renamed workshop", status: "approved" });
  });
  it("updateEvent: clash rejected and nothing changes; capacity below confirmed; draft is BAD_STATE", async () => {
    const m = await dr(); const r = await reg();
    mkEvent("o1", "open", 5);
    mkEvent("o2", "open", 5, "2031-01-01T13:00:00.000Z", "2031-01-01T15:00:00.000Z");
    const before = row("o2");
    expect(await code(m.updateEvent(COORD, "o2", { startsAt: "2031-01-01T11:00:00.000Z" }))).toBe("VENUE_CLASH");
    expect(row("o2")).toEqual(before);
    await r.registerForEvent(S1, "o1"); await r.registerForEvent(S2, "o1");
    const t = await msg(m.updateEvent(COORD, "o1", { capacity: 1 }));
    expect(t).toContain("2");
    expect(t).not.toMatch(NO_SQL);
    expect(await code(m.updateEvent(COORD, E(1), { capacity: 3 }))).toBe("BAD_STATE");
    expect(await code(m.updateEvent(COORD2, "o1", { capacity: 3 }))).toBe("NOT_ALLOWED");
    expect(await code(m.updateEvent(S1, "o1", { capacity: 3 }))).toBe("NOT_ALLOWED");
  });
  it("advanceEvent walks approved -> open -> ongoing -> completed", async () => {
    const m = await dr();
    expect(await m.advanceEvent(COORD, E(3))).toBe("open");
    expect(await m.advanceEvent(COORD, E(3))).toBe("ongoing");
    expect(await m.advanceEvent(COORD, E(3))).toBe("completed");
    expect(await code(m.advanceEvent(COORD, E(3)))).toBe("BAD_STATE");
    expect(await code(m.advanceEvent(COORD, E(1)))).toBe("BAD_STATE");
    expect(await code(m.advanceEvent(COORD2, E(4)))).toBe("NOT_ALLOWED");
    expect(await code(m.advanceEvent(ADMIN, E(4)))).toBe("NOT_ALLOWED");
    expect(await code(m.advanceEvent(COORD2, E(2)))).toBe("BAD_STATE");
  });
});

const PROJ = "c0000000-0000-0000-0000-000000000001";
const MIC = "c0000000-0000-0000-0000-000000000002";

describe("catalog", () => {
  it("listVenues includes retired venues with future_events; any role", async () => {
    const m = await ca();
    const v = await m.listVenues(S1);
    expect(v).toHaveLength(6);
    expect(v.find((x) => x.name === "Main Auditorium")!.future_events).toBe(1); // keynote; cancelled hackathon excluded
    expect(v.find((x) => x.name === "Old Gymkhana Hall")!.active).toBe(0);
  });
  it("busyVenues lists active-status overlaps only", async () => {
    const m = await ca();
    const kv = "b0000000-0000-0000-0000-000000000001";
    const near = db.prepare("SELECT starts_at s, ends_at e FROM events WHERE id = ?").get(E(4)) as { s: string; e: string };
    const rows = await m.busyVenues(COORD, near.s, near.e);
    expect(rows.filter((r) => r.venue_id === kv).map((r) => r.event_title)).toEqual(["Annual Tech Fest Keynote"]); // cancelled one on same slot hidden
    expect(await m.busyVenues(COORD, near.s, near.e, E(4))).toEqual(rows.filter((r) => r.event_title !== "Annual Tech Fest Keynote"));
    mkEvent("dr", "draft"); mkEvent("rt", "returned");
    expect(await m.busyVenues(ADMIN, "2031-01-01T00:00:00.000Z", "2031-01-02T00:00:00.000Z")).toEqual([]);
    expect(await code(m.busyVenues(S1, near.s, near.e))).toBe("NOT_ALLOWED");
  });
  it("listResources reports in_use and reserved_peak; students refused", async () => {
    const m = await ca();
    const now = (await m.listResources(COORD)).find((r) => r.id === MIC)!;
    expect(now.in_use).toBe(0);
    expect(now.reserved_peak).toBe(4);
    const wide = await m.listResources(ADMIN, new Date().toISOString(), new Date(Date.now() + 30 * 86_400_000).toISOString());
    expect(wide.find((r) => r.id === PROJ)).toMatchObject({ in_use: 4, quantity: 5, reserved_peak: 2 });
    expect(await code(m.listResources(S1))).toBe("NOT_ALLOWED");
  });
  it("saveVenue: admin adds, edits and retires; validates; others refused", async () => {
    const m = await ca();
    const id = await m.saveVenue(ADMIN, { name: "  New Hall ", capacity: 50, location: "Block B", active: true });
    expect(db.prepare("SELECT name, capacity, active FROM venues WHERE id = ?").get(id)).toMatchObject({ name: "New Hall", capacity: 50, active: 1 });
    await m.saveVenue(ADMIN, { id, name: "New Hall", capacity: 60, active: false });
    expect(db.prepare("SELECT capacity, active FROM venues WHERE id = ?").get(id)).toMatchObject({ capacity: 60, active: 0 });
    for (const bad of [{ name: "", capacity: 5 }, { name: "x", capacity: 0 }, { name: "x", capacity: 2.5 }, { name: "x".repeat(81), capacity: 5 }])
      expect(await code(m.saveVenue(ADMIN, { ...bad, active: true }))).toBe("INVALID_INPUT");
    expect(await code(m.saveVenue(ADMIN, { id: "nope", name: "x", capacity: 5, active: true }))).toBe("INVALID_INPUT");
    expect(await code(m.saveVenue(COORD, { name: "x", capacity: 5, active: true }))).toBe("NOT_ALLOWED");
    expect(await code(m.saveVenue(S1, { name: "x", capacity: 5, active: true }))).toBe("NOT_ALLOWED");
  });
  it("saveResource: cannot drop below reserved peak; retire keeps the row", async () => {
    const m = await ca();
    const t = await msg(m.saveResource(ADMIN, { id: MIC, name: "Microphones", quantity: 3, active: true }));
    expect(t).toBe("4 are already reserved for events. Choose 4 or more.");
    await m.saveResource(ADMIN, { id: MIC, name: "Microphones", quantity: 4, active: false });
    expect(db.prepare("SELECT quantity, active FROM resources WHERE id = ?").get(MIC)).toMatchObject({ quantity: 4, active: 0 });
    const id = await m.saveResource(ADMIN, { name: "Laser pointer", quantity: 3, active: true });
    expect(db.prepare("SELECT name FROM resources WHERE id = ?").get(id)).toMatchObject({ name: "Laser pointer" });
    expect(await code(m.saveResource(ADMIN, { name: "x", quantity: 0, active: true }))).toBe("INVALID_INPUT");
    expect(await code(m.saveResource(ADMIN, { id: "nope", name: "x", quantity: 1, active: true }))).toBe("INVALID_INPUT");
    expect(await code(m.saveResource(COORD, { name: "x", quantity: 1, active: true }))).toBe("NOT_ALLOWED");
    expect(await code(m.saveResource(S1, { name: "x", quantity: 1, active: true }))).toBe("NOT_ALLOWED");
  });
});

describe("allocations and tasks", () => {
  const qty = (e: string, r: string) => (db.prepare("SELECT quantity q FROM resource_allocations WHERE event_id = ? AND resource_id = ?").get(e, r) as { q: number } | undefined)?.q;
  it("setAllocation sets, updates, removes; over-limit leaves rows unchanged", async () => {
    const m = await al();
    mkEvent("d1", "draft");
    await m.setAllocation(COORD, "d1", PROJ, 3);
    await m.setAllocation(COORD, "d1", PROJ, 4);
    expect(qty("d1", PROJ)).toBe(4);
    const t = await msg(m.setAllocation(COORD, "d1", PROJ, 6));
    expect(await code(m.setAllocation(COORD, "d1", PROJ, 6))).toBe("RESOURCE_SHORT");
    expect(t).not.toMatch(NO_SQL);
    expect(qty("d1", PROJ)).toBe(4);
    await m.setAllocation(COORD, "d1", PROJ, 0);
    expect(qty("d1", PROJ)).toBeUndefined();
  });
  it("setAllocation respects overlapping events, inactive resources, owner and status", async () => {
    const m = await al();
    mkEvent("o1", "open"); db.prepare("INSERT INTO resource_allocations (id,event_id,resource_id,quantity) VALUES ('x1','o1',?,4)").run(PROJ);
    mkEvent("d1", "draft");
    expect(await code(m.setAllocation(COORD, "d1", PROJ, 2))).toBe("RESOURCE_SHORT");
    await m.setAllocation(COORD, "d1", PROJ, 1);
    db.prepare("INSERT INTO resources (id,name,quantity,active) VALUES ('rx','Old',3,0)").run();
    expect(await code(m.setAllocation(COORD, "d1", "rx", 1))).toBe("INVALID_INPUT");
    expect(await code(m.setAllocation(COORD2, "d1", PROJ, 1))).toBe("NOT_ALLOWED");
    expect(await code(m.setAllocation(S1, "d1", PROJ, 1))).toBe("NOT_ALLOWED");
    expect(await code(m.setAllocation(ADMIN, "d1", PROJ, 1))).toBe("NOT_ALLOWED");
    expect(await code(m.setAllocation(COORD, E(4), PROJ, 1))).toBe("BAD_STATE");
    expect(await code(m.setAllocation(COORD, "d1", PROJ, -1))).toBe("INVALID_INPUT");
  });
  it("listAllocations / listEventTasks: owner and admin only", async () => {
    const m = await al();
    expect((await m.listAllocations(COORD, E(4))).map((r) => [r.name, r.quantity])).toEqual([["Microphones", 4], ["Projector", 2]]);
    expect(await m.listAllocations(ADMIN, E(4))).toHaveLength(2);
    expect(await m.listEventTasks(COORD, E(4))).toHaveLength(4);
    expect(await m.listEventTasks(ADMIN, E(4))).toHaveLength(4);
    for (const who of [COORD2, S1]) {
      expect(await code(m.listAllocations(who, E(4)))).toBe("NOT_ALLOWED");
      expect(await code(m.listEventTasks(who, E(4)))).toBe("NOT_ALLOWED");
    }
  });
  it("createTask inserts task and notification; validates; owner only", async () => {
    const m = await al();
    const due = "2031-02-01T10:00:00.000Z";
    const id = await m.createTask(COORD, E(4), { title: " Order snacks ", assigneeId: S2.id, dueAt: due });
    expect(db.prepare("SELECT title, status FROM tasks WHERE id = ?").get(id)).toMatchObject({ title: "Order snacks", status: "todo" });
    expect(db.prepare("SELECT count(*) c FROM notifications WHERE user_id = ? AND kind = 'task_assigned' AND body LIKE '%Order snacks%'").get(S2.id)).toMatchObject({ c: 1 });
    const t = (o: object) => m.createTask(COORD, E(4), { title: "ok", assigneeId: S2.id, dueAt: due, ...o });
    expect(await code(t({ title: "" }))).toBe("INVALID_INPUT");
    expect(await code(t({ title: "x".repeat(121) }))).toBe("INVALID_INPUT");
    expect(await code(t({ dueAt: "tomorrow" }))).toBe("INVALID_INPUT");
    expect(await code(t({ assigneeId: COORD2.id }))).toBe("INVALID_INPUT");
    expect(await code(t({ assigneeId: "nope" }))).toBe("INVALID_INPUT");
    expect(await code(m.createTask(COORD2, E(7), { title: "ok", assigneeId: S2.id, dueAt: due }))).toBe("BAD_STATE");
    expect(await code(m.createTask(COORD2, E(4), { title: "ok", assigneeId: S2.id, dueAt: due }))).toBe("NOT_ALLOWED");
    expect(await code(m.createTask(S1, E(4), { title: "ok", assigneeId: S2.id, dueAt: due }))).toBe("NOT_ALLOWED");
    expect(await code(m.createTask(ADMIN, E(4), { title: "ok", assigneeId: S2.id, dueAt: due }))).toBe("NOT_ALLOWED");
  });
  it("listCoordinatorTasks is scoped", async () => {
    const m = await al();
    const mine = await m.listCoordinatorTasks(COORD);
    expect(mine).toHaveLength(4);
    expect(mine[0]).toMatchObject({ event_title: "Annual Tech Fest Keynote" });
    expect(mine.every((t) => t.assignee_name)).toBe(true);
    expect(await m.listCoordinatorTasks(COORD2)).toEqual([]);
    expect(await m.listCoordinatorTasks(ADMIN)).toHaveLength(4);
    expect(await code(m.listCoordinatorTasks(S1))).toBe("NOT_ALLOWED");
  });
});

describe("people", () => {
  it("myProfile returns only the caller's own row", async () => {
    const m = await pe();
    expect(await m.myProfile(S1)).toEqual({ name: "Asha Patel", department: "Computer Science", is_organizer: true });
    expect(await m.myProfile(S2)).toMatchObject({ name: "Karan Shah", is_organizer: false });
  });
  it("listStudents: coordinator and admin only", async () => {
    const m = await pe();
    expect((await m.listStudents(COORD)).map((s) => s.name)).toEqual(["Asha Patel", "Dev Kulkarni", "Karan Shah", "Meera Iyer"]);
    expect(await m.listStudents(ADMIN)).toHaveLength(4);
    expect(await code(m.listStudents(S1))).toBe("NOT_ALLOWED");
  });
  it("listMyTasks and listMyRegistrations are own-only", async () => {
    const m = await pe();
    const t = await m.listMyTasks(S1);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ title: "Collect speaker bio", status: "todo" });
    const regs = await m.listMyRegistrations(S1);
    expect(regs.map((r) => r.title).sort()).toEqual(["Annual Tech Fest Keynote", "CAD Basics Seminar"]);
    expect(regs.every((r) => r.waitlist_pos === null)).toBe(true);
    const meera = await m.listMyRegistrations(S3);
    expect(meera.map((r) => r.reg_status).sort()).toEqual(["cancelled", "confirmed"]);
    expect(meera.find((r) => r.event_id === E(5))!.venue_name).toBe("Open Air Theatre");
    expect(await code(m.listMyTasks(COORD))).toBe("NOT_ALLOWED");
    expect(await code(m.listMyRegistrations(ADMIN))).toBe("NOT_ALLOWED");
  });
  it("waitlist_pos is 1-based by created_at then id", async () => {
    const m = await pe();
    const S4 = { id: "a0000000-0000-0000-0000-000000000007", role: "student" as const };
    expect((await m.listMyRegistrations(S4)).find((r) => r.event_id === E(5))).toMatchObject({ reg_status: "waitlisted", waitlist_pos: 1 });
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,created_at) VALUES ('w0',?,?, 'waitlisted','2000-01-01T00:00:00.000Z')").run(E(5), S1.id);
    expect((await m.listMyRegistrations(S4)).find((r) => r.event_id === E(5))!.waitlist_pos).toBe(2);
  });
});

describe("views", () => {
  it("students see only public events plus their own registrations; coordinators their own; admin all", async () => {
    const m = await vw();
    const s = await m.listEventsWithSeats(S1);
    expect(s.every((e) => ["open", "ongoing", "completed"].includes(e.status))).toBe(true);
    expect(s).toHaveLength(4); // keynote, open mic, reading circle, CAD (completed)
    expect((await m.listEventsWithSeats(COORD)).every((e) => e.coordinator_id === COORD.id)).toBe(true);
    expect(await m.listEventsWithSeats(COORD2)).toHaveLength(4);
    expect(await m.listEventsWithSeats(ADMIN)).toHaveLength(9);
    // registered-for but later hidden status still visible
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status) VALUES ('rh',?,?,'cancelled')").run(E(3), S1.id);
    expect((await m.listEventsWithSeats(S1)).some((e) => e.id === E(3))).toBe(true);
  });
  it("rows carry counts, my_reg and my_waitlist_pos but never names", async () => {
    const m = await vw();
    const k = (await m.listEventsWithSeats(S1)).find((e) => e.id === E(5))!;
    expect(k).toMatchObject({ confirmed: 2, waitlisted: 1, my_reg: null, my_waitlist_pos: null, venue_name: "Open Air Theatre", coordinator_name: "Rahul Mehta" });
    const w = (await m.listEventsWithSeats({ id: "a0000000-0000-0000-0000-000000000007", role: "student" })).find((e) => e.id === E(5))!;
    expect(w).toMatchObject({ my_reg: "waitlisted", my_waitlist_pos: 1 });
    expect(JSON.stringify(k)).not.toMatch(/Karan|Meera|Dev Kulkarni/);
    expect((await m.listEventsWithSeats(S1)).find((e) => e.id === E(4))).toMatchObject({ my_reg: "confirmed" });
  });
  it("getEventDetail matches the list row; hidden events are NOT_ALLOWED; null venue ok", async () => {
    const m = await vw();
    const list = (await m.listEventsWithSeats(S1)).find((e) => e.id === E(4));
    expect(await m.getEventDetail(S1, E(4))).toEqual(list);
    expect(await code(m.getEventDetail(S1, E(3)))).toBe("NOT_ALLOWED");
    expect(await code(m.getEventDetail(COORD2, E(3)))).toBe("NOT_ALLOWED");
    expect(await m.getEventDetail(COORD, E(1))).toMatchObject({ venue_name: null, venue_id: null, status: "draft", coordinator_name: "Priya Nair" });
    expect((await m.getEventDetail(ADMIN, E(2))).id).toBe(E(2));
  });
});

describe("admin bookings", () => {
  const from = "2000-01-01T00:00:00.000Z", to = "2100-01-01T00:00:00.000Z";
  it("admin only; clean seed has no conflicts; cancelled excluded; draft without venue excluded", async () => {
    const m = await ad();
    const rows = await m.listBookings(ADMIN, from, to);
    expect(rows.every((r) => r.conflict === null)).toBe(true);
    expect(rows.some((r) => r.status === "cancelled" || r.event_id === E(1))).toBe(false);
    expect(await code(m.listBookings(COORD, from, to))).toBe("NOT_ALLOWED");
    expect(await code(m.listBookings(S1, from, to))).toBe("NOT_ALLOWED");
  });
  it("flags a draft overlapping an active event, and a live event on a retired venue", async () => {
    const m = await ad();
    mkEvent("o1", "open"); mkEvent("d1", "draft", 1, "2031-01-01T11:00:00.000Z", "2031-01-01T13:00:00.000Z");
    db.prepare("UPDATE venues SET active = 0 WHERE id = 'b0000000-0000-0000-0000-000000000006'").run();
    mkEvent("g1", "completed", 1, "2020-01-01T10:00:00.000Z", "2020-01-01T12:00:00.000Z", "b0000000-0000-0000-0000-000000000006");
    mkEvent("g2", "open", 1, "2031-05-01T10:00:00.000Z", "2031-05-01T12:00:00.000Z", "b0000000-0000-0000-0000-000000000006");
    const by = Object.fromEntries((await m.listBookings(ADMIN, from, to)).map((r) => [r.event_id, r]));
    expect(by.d1.conflict).toContain("Test o1");
    expect(by.o1.conflict).toContain("Test d1");
    expect(by.g1.conflict).toBeNull();
    expect(by.g2.conflict).toContain("retired");
    expect(Object.values(by).filter((r) => r.conflict).map((r) => r.event_id).sort()).toEqual(["d1", "g2", "o1"]);
  });
  it("flagConflicts is pure", async () => {
    const m = await ad();
    const base = { event_id: "a", title: "A", status: "open", department: null, venue_id: "v", venue_name: "V", venue_active: 1, starts_at: "2031-01-01T10:00:00.000Z", ends_at: "2031-01-01T11:00:00.000Z" };
    const input = [base, { ...base, event_id: "b", title: "B", status: "returned" }];
    const snap = JSON.stringify(input);
    expect(m.flagConflicts(input).map((r) => r.conflict !== null)).toEqual([true, true]);
    expect(JSON.stringify(input)).toBe(snap);
  });
});
