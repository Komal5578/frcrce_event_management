import { beforeEach, expect, it, vi } from "vitest";
import { d1Shim, freshDb } from "../helpers/sqlite";

let db: ReturnType<typeof freshDb>;
const ASHA = "a0000000-0000-0000-0000-000000000004";
let who = { id: ASHA, name: "Asha Patel", role: "student" };
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));
vi.mock("@/lib/auth", () => ({ requireRole: async () => who }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
beforeEach(() => { db = freshDb({ seed: true }); who = { id: ASHA, name: "Asha Patel", role: "student" }; });

const OPEN_MIC = "e0000000-0000-0000-0000-000000000005"; // capacity 2, 2 confirmed, 1 waitlisted
const KEYNOTE = "e0000000-0000-0000-0000-000000000004"; // Asha already confirmed
const NOT_TEXT = /sqlite|constraint|trigger|select/i;

it("register on a full event waitlists; second attempt gives the plain error", async () => {
  const { registerAction } = await import("@/app/(student)/student/actions");
  expect(await registerAction(OPEN_MIC)).toEqual({ ok: true, status: "waitlisted" });
  const again = await registerAction(OPEN_MIC);
  expect(again.error).toBe("You are already registered for this event.");
  expect(again.error).not.toMatch(NOT_TEXT);
});

it("register on an open event with seats confirms", async () => {
  const { registerAction, cancelRegistrationAction } = await import("@/app/(student)/student/actions");
  expect((await cancelRegistrationAction(KEYNOTE)).ok).toBe(true);
  expect(await registerAction(KEYNOTE)).toEqual({ ok: true, status: "confirmed" });
});

it("cancel promotes the first waitlisted student", async () => {
  const { registerAction, cancelRegistrationAction } = await import("@/app/(student)/student/actions");
  who = { id: "a0000000-0000-0000-0000-000000000005", name: "Karan", role: "student" }; // confirmed on Open Mic
  expect((await cancelRegistrationAction(OPEN_MIC)).ok).toBe(true);
  const dev = db.prepare("SELECT status FROM registrations WHERE event_id = ? AND user_id = 'a0000000-0000-0000-0000-000000000007'").get(OPEN_MIC);
  expect(dev?.status).toBe("confirmed");
  expect((await cancelRegistrationAction(OPEN_MIC)).error).toBe("You are not registered for this event.");
  void registerAction;
});

it("task: assignee can mark done, non-assignee cannot", async () => {
  const { setTaskAction } = await import("@/app/(student)/student/actions");
  const mine = "20000000-0000-0000-0000-000000000004";
  expect(await setTaskAction(mine, "Done")).toEqual({ ok: true });
  expect(db.prepare("SELECT status FROM tasks WHERE id = ?").get(mine)?.status).toBe("done");
  const theirs = "20000000-0000-0000-0000-000000000001";
  expect((await setTaskAction(theirs, "Done")).error).toBe("You cannot change this task.");
  expect((await setTaskAction(mine, "Bogus")).error).toBe("Choose To do, Doing or Done.");
});

it("never returns raw database text", async () => {
  const { registerAction } = await import("@/app/(student)/student/actions");
  const r = await registerAction("no-such-event");
  expect(r.error).toBeTruthy();
  expect(r.error).not.toMatch(NOT_TEXT);
});

it("a non-student actor is refused by the domain layer", async () => {
  const { registerAction } = await import("@/app/(student)/student/actions");
  who = { id: "a0000000-0000-0000-0000-000000000001", name: "Priya", role: "coordinator" };
  expect((await registerAction(OPEN_MIC)).error).toBeTruthy();
});
