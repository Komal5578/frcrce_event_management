// Stable error codes + plain-language messages (what happened, why, what to do).
// D1 error text (trigger markers, constraint names) is mapped here and never shown to users.
export type ErrorCode =
  | "VENUE_CLASH" | "ALREADY_REGISTERED" | "NOT_ALLOWED" | "INVALID_INPUT"
  | "RESOURCE_SHORT" | "EVENT_FULL" | "BAD_STATE" | "INTERNAL";

export class DomainError extends Error {
  constructor(public code: ErrorCode, message: string) { super(message); this.name = "DomainError"; }
}

const MSG: Record<ErrorCode, string> = {
  VENUE_CLASH: "That venue is already booked for part of this time. Pick another venue or time.",
  ALREADY_REGISTERED: "You are already registered for this event.",
  NOT_ALLOWED: "You do not have permission to do that.",
  INVALID_INPUT: "Some details are missing or not valid. Check the form and try again.",
  RESOURCE_SHORT: "Not enough of that resource is free for this time. Choose a smaller number or another time.",
  EVENT_FULL: "This event is full. You can join the waitlist instead.",
  BAD_STATE: "This can't be done at the event's current stage. Refresh the page to see where it stands.",
  INTERNAL: "Something went wrong on our side. Please try again in a moment.",
};
const mk = (c: ErrorCode, m = MSG[c]) => new DomainError(c, m);

/** Convert anything thrown by D1 into a DomainError (DomainErrors pass through). */
export function humanize(err: unknown): DomainError {
  if (err instanceof DomainError) return err;
  const t = String((err as { message?: string })?.message ?? err);
  for (const c of ["VENUE_CLASH", "EVENT_FULL", "RESOURCE_SHORT", "BAD_STATE"] as const) if (t.includes(c)) return mk(c);
  if (t.includes("UNIQUE") && t.includes("registrations.")) return mk("ALREADY_REGISTERED");
  if (t.includes("events_complete_unless_draft")) return mk("INVALID_INPUT", "Add a venue, date and capacity before submitting.");
  if (t.includes("events_time_order")) return mk("INVALID_INPUT", "The event must end after it starts.");
  if (/CHECK|NOT NULL|FOREIGN KEY/.test(t)) return mk("INVALID_INPUT");
  return mk("INTERNAL");
}

/** Run a DB step; any failure leaves as a DomainError. */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw humanize(e); }
}
