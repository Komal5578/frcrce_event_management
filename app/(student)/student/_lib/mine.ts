import { REMINDER_DAYS, isOverdue } from "@/lib/domain/rules";
import type { MyRegistration, MyTask } from "@/lib/domain/people";
import { formatDate, formatTime, relativeDay } from "@/lib/format";

const live = (r: MyRegistration) => r.reg_status === "confirmed" || r.reg_status === "waitlisted";
const startOf = (r: MyRegistration) => r.starts_at ?? "";

/** Still ahead: registered, event not cancelled/completed, not yet finished. */
export function isUpcoming(r: MyRegistration, now: Date): boolean {
  if (!live(r) || r.event_status === "cancelled" || r.event_status === "completed") return false;
  const end = r.ends_at ?? r.starts_at;
  return !!end && new Date(end).getTime() > now.getTime();
}

export function group(regs: MyRegistration[], now: Date) {
  const comingUp = regs.filter((r) => isUpcoming(r, now)).sort((a, b) => startOf(a).localeCompare(startOf(b)));
  const past = regs.filter((r) => !isUpcoming(r, now)).sort((a, b) => startOf(b).localeCompare(startOf(a)));
  return { comingUp, past };
}

/** "Reminder: Open Mic Night is tomorrow at 17:00, Hall A." for events starting within the reminder window. */
export function reminders(regs: MyRegistration[], now: Date): string[] {
  return group(regs, now).comingUp
    .filter((r) => r.starts_at && new Date(r.starts_at).getTime() - now.getTime() <= REMINDER_DAYS * 86_400_000
      && new Date(r.starts_at).getTime() > now.getTime())
    .map((r) => {
      const when = relativeDay(r.starts_at!, now)?.toLowerCase() ?? `on ${formatDate(r.starts_at!)}`;
      return `Reminder: ${r.title} is ${when} at ${formatTime(r.starts_at!)}${r.venue_name ? `, ${r.venue_name}` : ""}.`;
    });
}

/** Overdue first, then by due date (no date last). */
export function orderTasks(tasks: MyTask[], now: Date): MyTask[] {
  const rank = (t: MyTask) => (isOverdue(t, now) ? 0 : 1);
  return [...tasks].sort((a, b) => rank(a) - rank(b) || (a.due_at ?? "9").localeCompare(b.due_at ?? "9"));
}

export const taskBadge = (t: MyTask, now: Date) => (isOverdue(t, now) ? "overdue" : (t.status as "todo" | "doing" | "done"));
