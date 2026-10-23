import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "../helpers/sqlite";

let db: DatabaseSync;
let me = { id: "a0000000-0000-0000-0000-000000000001", name: "Priya", role: "coordinator" };
const redirected: string[] = [];
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));
vi.mock("@/lib/auth", () => ({ requireRole: async () => me }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (t: string) => { redirected.push(t); throw new Error("NEXT_REDIRECT"); } }));

const E = (n: number) => `e0000000-0000-0000-0000-00000000000${n}`;
const TPL = "d0000000-0000-0000-0000-000000000001";
const KARAN = "a0000000-0000-0000-0000-000000000005";
const PROJECTOR = "c0000000-0000-0000-0000-000000000001";
const NO_SQL = /sqlite|constraint|trigger|select/i;
const act = () => import("@/app/(coordinator)/coordinator/actions");
const row = (id: string) => db.prepare("SELECT * FROM events WHERE id = ?").get(id) as Record<string, unknown>;
const count = (sql: string, ...a: string[]) => Number((db.prepare(sql).get(...a) as { c: number }).c);

beforeEach(() => {
  db = freshDb({ seed: true });
  me = { id: "a0000000-0000-0000-0000-000000000001", name: "Priya", role: "coordinator" };
  redirected.length = 0;
});

describe("coordinator actions", () => {
  it("startDraft creates a draft and redirects to its edit page", async () => {
    const a = await act();
    await expect(a.startDraft(TPL)).rejects.toThrow("NEXT_REDIRECT");
    const id = redirected[0].split("/")[2];
    expect(redirected[0]).toBe(`/coordinator/${id}/edit?step=1`);
    expect(row(id)).toMatchObject({ status: "draft", coordinator_id: me.id, title: "Workshop - Computer Science" });
    await expect(a.startDraft("blank")).rejects.toThrow("NEXT_REDIRECT");
    expect((await a.startDraft("")).error).toMatch(/Choose a template/);
    expect((await a.startDraft("nope")).error).toMatch(/no longer exists/);
  });

  it("saveDraftAction patches details and schedule, returns exact field errors", async () => {
    const a = await act();
    expect(await a.saveDraftAction(E(1), 1, { title: "Quiz Night", seats: "30" })).toEqual({ ok: true });
    expect(row(E(1))).toMatchObject({ title: "Quiz Night", capacity: 30 });
    expect((await a.saveDraftAction(E(1), 1, { title: "", seats: "0" })).fieldErrors).toEqual({
      title: "Enter a title, for example Quiz Night.", seats: "Enter the number of seats as a whole number, at least 1.",
    });
    const bad = await a.saveDraftAction(E(1), 2, { date: "2031-01-01", start: "12:00", end: "10:00" });
    expect(bad.fieldErrors?.end).toBe("Choose an end time after the start time.");
    const ok = await a.saveDraftAction(E(1), 2, { date: "2031-01-01", start: "10:00", end: "12:00", venueId: "b0000000-0000-0000-0000-000000000003" });
    expect(ok.ok).toBe(true);
    expect(row(E(1))).toMatchObject({ starts_at: "2031-01-01T04:30:00.000Z", venue_id: "b0000000-0000-0000-0000-000000000003" });
  });

  it("setAllocationAction over the limit gives the resource message", async () => {
    const a = await act();
    expect((await a.setAllocationAction(E(1), PROJECTOR, 2)).ok).toBe(true);
    const r = await a.setAllocationAction(E(1), PROJECTOR, 99);
    expect(r.error).toMatch(/Not enough of that resource/);
    expect(r.error).not.toMatch(NO_SQL);
  });

  it("addTaskAction creates a task and a notification", async () => {
    const a = await act();
    const before = count("SELECT count(*) c FROM notifications");
    const r = await a.addTaskAction(E(1), { title: "Book mics", assignee: KARAN, due: "2031-01-01" });
    expect(r.ok).toBe(true);
    expect(count("SELECT count(*) c FROM tasks WHERE event_id = ? AND assignee_id = ?", E(1), KARAN)).toBe(1);
    expect(count("SELECT count(*) c FROM notifications")).toBe(before + 1);
    expect((await a.addTaskAction(E(1), { title: "x", assignee: KARAN, due: "" })).fieldErrors?.due).toBe("Choose a due date.");
  });

  it("submitAction moves draft to pending; second call gives the stage text", async () => {
    const a = await act();
    await a.saveDraftAction(E(1), 2, { date: "2031-01-01", start: "10:00", end: "12:00", venueId: "b0000000-0000-0000-0000-000000000003" });
    await a.saveDraftAction(E(1), 1, { title: "Git", seats: "20" });
    expect((await a.submitAction(E(1))).ok).toBe(true);
    expect(row(E(1)).status).toBe("pending");
    const again = await a.submitAction(E(1));
    expect(again.error).toMatch(/already pending/);
    expect(again.error).not.toMatch(NO_SQL);
  });

  it("an incomplete draft cannot be submitted and the message is human", async () => {
    const a = await act();
    const r = await a.submitAction(E(1));
    expect(r.error).toBeTruthy();
    expect(r.error).not.toMatch(NO_SQL);
  });

  it("advanceAction approved -> open", async () => {
    const a = await act();
    expect(await a.advanceAction(E(3))).toEqual({ ok: true, status: "open" });
    expect(row(E(3)).status).toBe("open");
    expect((await a.advanceAction(E(1))).error).toBeTruthy();
  });

  it("cancelAction notifies registrants and reports the count", async () => {
    const a = await act();
    const before = count("SELECT count(*) c FROM notifications WHERE kind = 'event_cancelled'");
    expect(await a.cancelAction(E(4), "Speaker ill")).toEqual({ ok: true, count: 2 });
    expect(row(E(4)).status).toBe("cancelled");
    expect(count("SELECT count(*) c FROM notifications WHERE kind = 'event_cancelled'")).toBe(before + 2);
  });

  it("changeAction on an open event returns the notified count", async () => {
    const a = await act();
    const r = await a.changeAction(E(4), { title: "Keynote 2", seats: "400" });
    expect(r).toEqual({ ok: true, count: 2 });
    expect(row(E(4)).title).toBe("Keynote 2");
  });

  it("another coordinator's event id is refused with human text", async () => {
    const a = await act();
    const results = [
      await a.saveDraftAction(E(9), 1, { title: "Hijack", seats: "5" }),
      await a.submitAction(E(9)),
      await a.advanceAction(E(5)),
      await a.cancelAction(E(5), "x"),
      await a.changeAction(E(5), { title: "Hijack", seats: "5" }),
      await a.addTaskAction(E(5), { title: "t", assignee: KARAN, due: "2031-01-01" }),
      await a.setAllocationAction(E(9), PROJECTOR, 1),
    ];
    for (const r of results) {
      expect(r.error).toMatch(/Only the event coordinator|cannot see this event/);
      expect(r.error).not.toMatch(NO_SQL);
    }
    expect(row(E(9)).title).toBe("Electronics Expo");
  });

  it("a non-coordinator session cannot act (domain refuses the role)", async () => {
    me = { id: "a0000000-0000-0000-0000-000000000004", name: "Asha", role: "student" };
    const a = await act();
    expect((await a.submitAction(E(1))).error).toMatch(/permission/);
    expect(row(E(1)).status).toBe("draft");
  });
});
