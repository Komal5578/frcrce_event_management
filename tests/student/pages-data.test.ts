import { beforeEach, expect, it, vi } from "vitest";
import { d1Shim, freshDb } from "../helpers/sqlite";

let db: ReturnType<typeof freshDb>;
const ASHA = { id: "a0000000-0000-0000-0000-000000000004", role: "student" as const };
const OPEN_MIC = "e0000000-0000-0000-0000-000000000005";
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));
beforeEach(() => { db = freshDb({ seed: true }); });

it("detail model: one action per registration state, no registrant identities", async () => {
  const { getEventDetail } = await import("@/lib/domain/views");
  const { registerForEvent, cancelRegistration } = await import("@/lib/domain/registrations");
  const { detailModel } = await import("@/app/(student)/student/_lib/view");
  const e = await getEventDetail(ASHA, OPEN_MIC);
  expect(detailModel(e).cta).toBe("waitlist");
  expect(JSON.stringify(e)).not.toMatch(/Karan|a0000000-0000-0000-0000-000000000005/);
  expect(await registerForEvent(ASHA, OPEN_MIC)).toBe("waitlisted");
  const w = detailModel(await getEventDetail(ASHA, OPEN_MIC));
  expect(w.cta).toBe("none");
  expect(w.waitlistNote).toMatch(/You are number \d+ on the waitlist/);
  await cancelRegistration(ASHA, OPEN_MIC);
  const { listMyRegistrations } = await import("@/lib/domain/people");
  const r = (await listMyRegistrations(ASHA)).find((x) => x.event_id === OPEN_MIC);
  expect(r?.reg_status).toBe("cancelled");
});

it("tasks and alerts are own-only", async () => {
  const { listMyTasks } = await import("@/lib/domain/people");
  const { listNotifications } = await import("@/lib/domain/notifications");
  expect((await listMyTasks(ASHA)).length).toBeGreaterThan(0);
  expect((await listNotifications(ASHA)).every((n) => n.user_id === ASHA.id)).toBe(true);
});
