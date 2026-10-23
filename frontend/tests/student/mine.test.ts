import { expect, it } from "vitest";
import { group, orderTasks, reminders } from "@/app/(student)/student/_lib/mine";
import type { MyRegistration, MyTask } from "@/lib/domain/people";

const NOW = new Date("2026-03-01T06:00:00.000Z");
const at = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();
const reg = (title: string, startH: number, o: Partial<MyRegistration> = {}): MyRegistration => ({
  event_id: title, title, event_status: "open", starts_at: at(startH), ends_at: at(startH + 2), venue_name: "Hall A", reg_status: "confirmed", waitlist_pos: null, ...o,
});

it("groups coming up soonest first, past newest first", () => {
  const g = group([reg("later", 100), reg("soon", 5), reg("old", -50), reg("older", -90), reg("gone", 10, { reg_status: "cancelled" }), reg("ev-cancelled", 10, { event_status: "cancelled" })], NOW);
  expect(g.comingUp.map((r) => r.title)).toEqual(["soon", "later"]);
  expect(g.past.map((r) => r.title).sort()).toEqual(["ev-cancelled", "gone", "old", "older"]);
  expect(g.past.slice(-2).map((r) => r.title)).toEqual(["old", "older"]);
});
it("an ongoing registered event is still coming up", () => {
  expect(group([reg("now", -1, { event_status: "ongoing" })], NOW).comingUp).toHaveLength(1);
});
it("reminders within 2 days use tomorrow/today wording and venue", () => {
  // 06:00Z = 11:30 IST; +24h is tomorrow 11:30
  expect(reminders([reg("Open Mic", 24)], NOW)).toEqual(["Reminder: Open Mic is tomorrow at 11:30, Hall A."]);
  expect(reminders([reg("Far", 100), reg("Cancelled", 24, { reg_status: "cancelled" })], NOW)).toEqual([]);
});
it("tasks: overdue first, then by due date", () => {
  const t = (id: string, dueH: number | null, status = "todo"): MyTask => ({ id, title: id, event_id: "e", event_title: "E", due_at: dueH === null ? null : at(dueH), status });
  const out = orderTasks([t("later", 50), t("odue-done", -5, "done"), t("overdue2", -2), t("overdue1", -30), t("none", null)], NOW);
  expect(out.map((x) => x.id)).toEqual(["overdue1", "overdue2", "odue-done", "later", "none"]);
});
