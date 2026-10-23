import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { visibleWhere, type EventRow } from "./events";
import type { Actor } from "./actor";

export type EventView = EventRow & {
  venue_name: string | null; venue_location: string | null; venue_capacity: number | null; coordinator_name: string | null;
  confirmed: number; waitlisted: number; my_reg: string | null; my_waitlist_pos: number | null; created_at: string; updated_at: string;
};

// ?1 is always the actor id (visibleWhere). Counts only, never registrant identities.
const SELECT =
  "SELECT e.*, v.name AS venue_name, v.location AS venue_location, v.capacity AS venue_capacity, c.name AS coordinator_name, " +
  "(SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed, " +
  "(SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') AS waitlisted, " +
  "(SELECT m.status FROM registrations m WHERE m.event_id = e.id AND m.user_id = ?1) AS my_reg, " +
  "(SELECT CASE WHEN m.status = 'waitlisted' THEN 1 + (SELECT count(*) FROM registrations w WHERE w.event_id = e.id " +
  "AND w.status = 'waitlisted' AND (w.created_at < m.created_at OR (w.created_at = m.created_at AND w.id < m.id))) END " +
  "FROM registrations m WHERE m.event_id = e.id AND m.user_id = ?1) AS my_waitlist_pos " +
  "FROM events e LEFT JOIN venues v ON v.id = e.venue_id LEFT JOIN profiles c ON c.id = e.coordinator_id";

/** One query, role-scoped: every event the actor may see, with seat counts and their own registration. */
export async function listEventsWithSeats(actor: Actor): Promise<EventView[]> {
  return guard(async () => (await getDb().prepare(SELECT + visibleWhere(actor) + " ORDER BY e.starts_at, e.id")
    .bind(actor.id).all<EventView>()).results);
}

export async function getEventDetail(actor: Actor, eventId: string): Promise<EventView> {
  const e = await guard(() => getDb().prepare(SELECT + visibleWhere(actor) + " AND e.id = ?2").bind(actor.id, eventId).first<EventView>());
  if (!e) throw new DomainError("NOT_ALLOWED", "You cannot see this event.");
  return e;
}
