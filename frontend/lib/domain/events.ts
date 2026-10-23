import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";

export type EventRow = {
  id: string; title: string; status: string; coordinator_id: string; venue_id: string | null;
  starts_at: string | null; ends_at: string | null; capacity: number | null;
  type: string | null; description: string | null; department: string | null;
  return_reason: string | null; cancel_reason: string | null;
};

// Constant WHERE fragments per role (no input is ever concatenated into SQL).
const VISIBLE = {
  student: " WHERE (e.status IN ('open','ongoing','completed') OR EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1))",
  coordinator: " WHERE e.coordinator_id = ?1",
  admin: " WHERE ?1 IS NOT NULL",
} as const;
export const visibleWhere = (a: Actor) => VISIBLE[a.role];

/** S1/S2, C6, A1: events the actor may see. */
export async function listVisibleEvents(actor: Actor): Promise<EventRow[]> {
  return guard(async () =>
    (await getDb().prepare("SELECT e.* FROM events e" + visibleWhere(actor) + " ORDER BY e.starts_at").bind(actor.id).all<EventRow>()).results);
}

/** Event the actor may manage (owner coordinator or admin) or NOT_ALLOWED. Same answer for missing events. */
export async function manageableEvent(actor: Actor, eventId: string) {
  requireActorRole(actor, "coordinator", "admin");
  const e = await guard(() => getDb().prepare(
    "SELECT id, status, title FROM events WHERE id = ?1 AND (coordinator_id = ?2 OR ?3 = 'admin')")
    .bind(eventId, actor.id, actor.role).first<{ id: string; status: string; title: string }>());
  if (!e) throw new DomainError("NOT_ALLOWED", "Only the event coordinator or an administrator can do that.");
  return e;
}

/** C5: owner submits a draft/returned event for review. */
export async function submitEvent(actor: Actor, eventId: string): Promise<void> {
  requireActorRole(actor, "coordinator");
  const r = await guard(() => getDb().prepare(
    "UPDATE events SET status = 'pending' WHERE id = ?1 AND coordinator_id = ?2 AND status IN ('draft','returned')")
    .bind(eventId, actor.id).run());
  if (r.meta.changes > 0) return;
  const e = await manageableEvent(actor, eventId);
  throw new DomainError("BAD_STATE", `This event is already ${e.status}; only drafts and returned events can be submitted.`);
}

/** A1: admin approves, or returns with a reason. */
export async function reviewEvent(actor: Actor, eventId: string, approve: boolean, reason?: string): Promise<void> {
  requireActorRole(actor, "admin");
  const why = reason?.trim() ?? "";
  if (!approve && !why) throw new DomainError("INVALID_INPUT", "Say why you are returning this event so the coordinator can fix it.");
  const r = await guard(() => getDb().prepare(
    "UPDATE events SET status = ?1, return_reason = ?2 WHERE id = ?3 AND status = 'pending'")
    .bind(approve ? "approved" : "returned", approve ? null : why, eventId).run());
  if (r.meta.changes === 0) throw new DomainError("BAD_STATE", "Only events waiting for review can be approved or returned.");
}

/** C7: cancel and tell registrants, atomically. */
export async function cancelEvent(actor: Actor, eventId: string, reason?: string): Promise<void> {
  const e = await manageableEvent(actor, eventId);
  if (!["draft", "pending", "returned", "approved", "open", "ongoing"].includes(e.status))
    throw new DomainError("BAD_STATE", "This event can no longer be cancelled.");
  const db = getDb();
  const body = `"${e.title}" has been cancelled.` + (reason?.trim() ? ` Reason: ${reason.trim()}` : "");
  // ponytail: read-then-batch; a race only costs a spurious notice, the UPDATE is still state-guarded.
  await guard(() => db.batch([
    db.prepare("UPDATE events SET status = 'cancelled', cancel_reason = ?2 WHERE id = ?1 AND status = ?3")
      .bind(eventId, reason?.trim() || null, e.status),
    db.prepare(
      "INSERT INTO notifications (id, user_id, event_id, kind, body) " +
      "SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'event_cancelled', ?2 " +
      "FROM registrations r WHERE r.event_id = ?1 AND r.status IN ('confirmed','waitlisted')").bind(eventId, body),
  ]));
}
