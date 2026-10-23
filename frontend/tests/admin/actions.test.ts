import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "../helpers/sqlite";

let db: DatabaseSync;
let role: "admin" | "coordinator" | "student" = "admin";
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));
vi.mock("@/lib/auth", () => ({
  requireRole: async () => ({ id: "a0000000-0000-0000-0000-000000000003", name: "Admin", role }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const PENDING = "e0000000-0000-0000-0000-000000000002"; // Robotics Guest Lecture, Seminar Hall A (120), 100 seats
const status = (id: string) => (db.prepare("SELECT status, return_reason FROM events WHERE id = ?").get(id) as { status: string; return_reason: string | null });
const actions = () => import("@/app/(admin)/admin/actions");
const RAW = /sqlite|constraint|trigger|select/i;

beforeEach(() => { db = freshDb({ seed: true }); role = "admin"; });

describe("admin actions", () => {
  it("approve moves pending to approved; a second call gives the BAD_STATE text", async () => {
    const a = await actions();
    expect(await a.approveAction(PENDING)).toEqual({ ok: true });
    expect(status(PENDING).status).toBe("approved");
    const again = await a.approveAction(PENDING);
    expect(again.error).toBe("Only events waiting for review can be approved or returned.");
  });

  it("approve refuses on a server-side seats clash and changes nothing", async () => {
    db.prepare("UPDATE events SET capacity = 200 WHERE id = ?").run(PENDING);
    const r = await (await actions()).approveAction(PENDING);
    expect(r.error).toBe("Seats 200 exceed capacity 120.");
    expect(status(PENDING).status).toBe("pending");
  });

  it("approve refuses on a resource shortfall with the verbatim sentence", async () => {
    db.prepare("INSERT INTO resource_allocations (id, event_id, resource_id, quantity) VALUES ('f9', ?, 'c0000000-0000-0000-0000-000000000001', 2)").run(PENDING);
    db.prepare("UPDATE resources SET quantity = 1 WHERE id = 'c0000000-0000-0000-0000-000000000001'").run();
    const r = await (await actions()).approveAction(PENDING);
    expect(r.error).toBe("Not enough Projector are free for this time: 1 free, 2 requested.");
    expect(status(PENDING).status).toBe("pending");
  });

  it("return needs a reason, then stores it", async () => {
    const a = await actions();
    expect((await a.returnAction(PENDING, "  ")).error).toBe("Say why you are returning this event so the coordinator can fix it.");
    expect(status(PENDING).status).toBe("pending");
    expect(await a.returnAction(PENDING, "Pick a bigger room")).toEqual({ ok: true });
    expect(status(PENDING)).toEqual({ status: "returned", return_reason: "Pick a bigger room" });
  });

  it("coordinator and student cannot act", async () => {
    const a = await actions();
    for (const r of ["coordinator", "student"] as const) {
      role = r;
      const res = await a.approveAction(PENDING);
      expect(res.error).toBeTruthy();
      expect(res.ok).toBeUndefined();
      expect((await a.saveVenueAction({ name: "X", capacity: "5", active: true })).ok).toBeUndefined();
    }
    expect(status(PENDING).status).toBe("pending");
  });

  it("venue create and update; field errors", async () => {
    const a = await actions();
    expect((await a.saveVenueAction({ name: "", capacity: "x", active: true })).fieldErrors).toBeTruthy();
    expect(await a.saveVenueAction({ name: "Studio", capacity: "20", active: true })).toEqual({ ok: true });
    const row = db.prepare("SELECT id FROM venues WHERE name = 'Studio'").get() as { id: string };
    expect(await a.saveVenueAction({ id: row.id, name: "Studio", capacity: "25", active: false })).toEqual({ ok: true });
    expect(db.prepare("SELECT capacity, active FROM venues WHERE id = ?").get(row.id)).toMatchObject({ capacity: 25, active: 0 });
  });

  it("resource below the reserved peak gives the verbatim message", async () => {
    const a = await actions();
    // Projector: Web Dev Workshop reserves 2 (approved, future)
    const r = await a.saveResourceAction({ id: "c0000000-0000-0000-0000-000000000001", name: "Projector", total: "1", active: true });
    expect(r.error).toBe("2 are already reserved for events. Choose 2 or more.");
    expect(await a.saveResourceAction({ id: "c0000000-0000-0000-0000-000000000001", name: "Projector", total: "2", active: true })).toEqual({ ok: true });
  });

  it("no returned error leaks raw database text", async () => {
    const a = await actions();
    const errs = [(await a.approveAction("nope")).error, (await a.returnAction("nope", "why")).error, (await a.saveVenueAction({ id: "nope", name: "A", capacity: "3", active: true })).error];
    for (const e of errs) { expect(e).toBeTruthy(); expect(e).not.toMatch(RAW); }
  });
});
