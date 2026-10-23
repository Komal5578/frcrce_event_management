import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "./helpers/sqlite";

let db: DatabaseSync;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));

const COORD = { id: "a0000000-0000-0000-0000-000000000001", role: "coordinator" as const };
const COORD2 = { id: "a0000000-0000-0000-0000-000000000002", role: "coordinator" as const };
const ADMIN = { id: "a0000000-0000-0000-0000-000000000003", role: "admin" as const };
const STUDENT = { id: "a0000000-0000-0000-0000-000000000004", role: "student" as const };

const ev = () => import("@/lib/domain/events");
const code = async (p: Promise<unknown>) => p.then(() => null, (e) => (e as { code?: string }).code ?? "RAW");

function mkDraft(owner: string, id = "e-draft", status = "draft") {
  db.prepare("INSERT INTO events (id, title, coordinator_id, status) VALUES (?,?,?,?)").run(id, "T", owner, status);
}

beforeEach(() => { db = freshDb({ seed: true }); });

describe("visibility", () => {
  it("student never sees draft, pending or returned events", async () => {
    mkDraft(COORD.id, "x-draft"); mkDraft(COORD.id, "x-ret", "returned");
    const { listVisibleEvents } = await ev();
    const rows = await listVisibleEvents(STUDENT);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(["open", "ongoing", "completed", "cancelled"]).toContain(r.status);
    expect(rows.find((r) => r.id === "x-draft")).toBeUndefined();
  });
  it("coordinator sees only own events, admin sees all", async () => {
    const { listVisibleEvents } = await ev();
    const mine = await listVisibleEvents(COORD);
    expect(mine.every((r) => r.coordinator_id === COORD.id)).toBe(true);
    const all = await listVisibleEvents(ADMIN);
    expect(all.length).toBeGreaterThan(mine.length);
  });
});

describe("writes", () => {
  it("student cannot submit, review or cancel events", async () => {
    mkDraft(COORD.id);
    const m = await ev();
    expect(await code(m.submitEvent(STUDENT, "e-draft"))).toBe("NOT_ALLOWED");
    expect(await code(m.reviewEvent(STUDENT, "e-draft", true))).toBe("NOT_ALLOWED");
    expect(await code(m.cancelEvent(STUDENT, "e-draft"))).toBe("NOT_ALLOWED");
  });
  it("coordinator cannot submit or cancel another coordinator's event", async () => {
    mkDraft(COORD.id);
    const m = await ev();
    expect(await code(m.submitEvent(COORD2, "e-draft"))).toBe("NOT_ALLOWED");
    expect(await code(m.cancelEvent(COORD2, "e-draft"))).toBe("NOT_ALLOWED");
  });
  it("coordinator cannot self-approve or write return_reason", async () => {
    const { reviewEvent } = await ev();
    const pending = db.prepare("SELECT id, coordinator_id FROM events WHERE status='pending'").get() as { id: string; coordinator_id: string };
    const owner = { id: pending.coordinator_id, role: "coordinator" as const };
    expect(await code(reviewEvent(owner, pending.id, true))).toBe("NOT_ALLOWED");
    expect(await code(reviewEvent(owner, pending.id, false, "no"))).toBe("NOT_ALLOWED");
    expect((db.prepare("SELECT status FROM events WHERE id=?").get(pending.id) as { status: string }).status).toBe("pending");
  });
  it("returning needs a reason; admin can return with one", async () => {
    const { reviewEvent } = await ev();
    const p = db.prepare("SELECT id FROM events WHERE status='pending'").get() as { id: string };
    expect(await code(reviewEvent(ADMIN, p.id, false, "  "))).toBe("INVALID_INPUT");
    await reviewEvent(ADMIN, p.id, false, "Pick another hall");
    expect(db.prepare("SELECT status, return_reason r FROM events WHERE id=?").get(p.id)).toMatchObject({ status: "returned", r: "Pick another hall" });
  });
  it("no exported function can change a profile role", async () => {
    for (const f of ["actor", "events", "registrations", "tasks", "venues", "notifications"]) {
      const names = Object.keys(await import(`@/lib/domain/${f}`));
      expect(names.filter((n) => /role|profile|promote/i.test(n) && n !== "requireActorRole")).toEqual([]);
    }
  });
});
