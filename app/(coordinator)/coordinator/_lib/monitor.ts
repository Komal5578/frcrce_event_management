// Pure view models for My Events and the monitor. `now` is always passed in.
import { isLowReg, isOverdue } from "@/lib/domain/rules";

type Ev = { status: string; capacity: number | null; confirmed: number; waitlisted?: number; starts_at: string | null; ends_at?: string | null };
type Task = { due_at: string | null; status: string };

export const NEXT_STEP: Record<string, string> = {
  pending: "Next: wait for approval",
  approved: "Next: open registration",
  open: "Next: start the event",
  ongoing: "Next: complete the event",
  returned: "Next: fix what the Admin asked and submit again",
};

export function monitorModel(ev: Ev, tasks: Task[], now: Date) {
  const cap = ev.capacity ?? 0;
  return {
    seatPercent: cap ? Math.round((ev.confirmed / cap) * 100) : 0,
    seatText: `${ev.confirmed} / ${cap}`,
    waitlist: ev.waitlisted ?? 0,
    lowReg: isLowReg(ev, now),
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
    tasksDone: tasks.filter((t) => t.status === "done").length,
    tasksTotal: tasks.length,
    next: NEXT_STEP[ev.status] ?? "",
  };
}

export const isPast = (ev: Ev & { status: string }, now: Date) =>
  ev.status === "completed" || ev.status === "cancelled" || (!!ev.ends_at && new Date(ev.ends_at) < now);

export const needsYou = (ev: { status: string }, overdue: number) => ev.status === "draft" || ev.status === "returned" || overdue > 0;

export type Chip = "attention" | "drafts" | "past";
/** No chip: everything not past. Chips are additive (union). */
export function filterEvents<E extends Ev>(events: E[], chips: Chip[], overdueOf: (e: E) => number, now: Date): E[] {
  if (!chips.length) return events.filter((e) => !isPast(e, now));
  return events.filter((e) =>
    (chips.includes("attention") && !isPast(e, now) && needsYou(e, overdueOf(e))) ||
    (chips.includes("drafts") && e.status === "draft") ||
    (chips.includes("past") && isPast(e, now)));
}

/** "today", "yesterday", "2 days ago" by whole 24h steps. */
export function ago(iso: string, now: Date): string {
  const d = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}
