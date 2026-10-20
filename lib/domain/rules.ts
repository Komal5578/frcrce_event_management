// Shared alert rules and defaults (pure). [assumed] values, tune here only.
export const LOWREG_FRACTION = 0.25; // low registrations: under 25% of capacity ...
export const LOWREG_DAYS = 7; // ... within 7 days of the start
export const REMINDER_DAYS = 2; // reminder window
export const BOOKABLE_HOURS_PER_DAY = 12; // venue utilisation basis

export function isOverdue(task: { due_at: string | null; status: string }, now: Date): boolean {
  return !!task.due_at && task.status !== "done" && new Date(task.due_at).getTime() < now.getTime();
}

export function isLowReg(
  ev: { status: string; capacity: number | null; starts_at: string | null; confirmed: number }, now: Date,
): boolean {
  if (ev.status !== "open" || !ev.capacity || !ev.starts_at) return false;
  const ms = new Date(ev.starts_at).getTime() - now.getTime();
  return ms > 0 && ms <= LOWREG_DAYS * 86_400_000 && ev.confirmed < LOWREG_FRACTION * ev.capacity;
}
