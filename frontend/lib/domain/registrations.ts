import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";
import { visibleWhere } from "./events";

/** S3: one-statement seat decision (confirmed or waitlisted); safe against the last-seat race. */
export async function registerForEvent(actor: Actor, eventId: string): Promise<"confirmed" | "waitlisted"> {
  requireActorRole(actor, "student");
  const db = getDb();
  const r = await guard(() => db.prepare(
    "INSERT INTO registrations (id, event_id, user_id, status, created_at) " +
    "SELECT ?1, e.id, ?2, CASE WHEN (SELECT count(*) FROM registrations x WHERE x.event_id = e.id AND x.status = 'confirmed') < e.capacity " +
    "THEN 'confirmed' ELSE 'waitlisted' END, strftime('%Y-%m-%dT%H:%M:%fZ','now') " +
    "FROM events e WHERE e.id = ?3 AND e.status = 'open' " +
    "ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status, created_at = excluded.created_at " +
    "WHERE registrations.status = 'cancelled'").bind(crypto.randomUUID(), actor.id, eventId).run());
  const row = await guard(() => db.prepare("SELECT status FROM registrations WHERE event_id = ?1 AND user_id = ?2")
    .bind(eventId, actor.id).first<{ status: string }>());
  if (r.meta.changes === 0) {
    if (row && row.status !== "cancelled") throw new DomainError("ALREADY_REGISTERED", "You are already registered for this event.");
    throw new DomainError("BAD_STATE", "Registration for this event is not open.");
  }
  return row!.status as "confirmed" | "waitlisted";
}

/** S3: leave an event; the DB trigger promotes the waitlist. */
export async function cancelRegistration(actor: Actor, eventId: string): Promise<void> {
  requireActorRole(actor, "student");
  const r = await guard(() => getDb().prepare(
    "UPDATE registrations SET status = 'cancelled' WHERE event_id = ?1 AND user_id = ?2 AND status IN ('confirmed','waitlisted')")
    .bind(eventId, actor.id).run());
  if (r.meta.changes === 0) throw new DomainError("BAD_STATE", "You are not registered for this event.");
}

/** S2, S3, C6: student-safe seat counts for an event the actor can see. */
export async function seatCounts(actor: Actor, eventId: string): Promise<{ confirmed: number; waitlisted: number }> {
  const row = await guard(() => getDb().prepare(
    "SELECT e.id, " +
    "(SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed, " +
    "(SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') AS waitlisted " +
    "FROM events e" + visibleWhere(actor) + " AND e.id = ?2").bind(actor.id, eventId)
    .first<{ confirmed: number; waitlisted: number }>());
  if (!row) throw new DomainError("NOT_ALLOWED", "You cannot see this event.");
  return { confirmed: row.confirmed, waitlisted: row.waitlisted };
}
