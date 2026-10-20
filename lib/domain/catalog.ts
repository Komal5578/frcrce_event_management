import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";

export type VenueRow = { id: string; name: string; capacity: number; location: string | null; active: number; future_events: number };
export type ResourceRow = { id: string; name: string; quantity: number; active: number; in_use: number; reserved_peak: number };
export type BusyRow = { venue_id: string; event_title: string; starts_at: string; ends_at: string };

const ACTIVE = "('pending','approved','open','ongoing')";
const bad = (m: string) => new DomainError("INVALID_INPUT", m);

/** Every venue (retired ones too) with the count of live events still ahead on it. */
export async function listVenues(actor: Actor): Promise<VenueRow[]> {
  void actor; // any signed-in role; the session already identifies the actor
  return guard(async () => (await getDb().prepare(
    "SELECT v.id, v.name, v.capacity, v.location, v.active, " +
    "(SELECT count(*) FROM events e WHERE e.venue_id = v.id AND e.status IN " + ACTIVE + " AND e.starts_at > ?1) AS future_events " +
    "FROM venues v ORDER BY v.active DESC, v.name").bind(new Date().toISOString()).all<VenueRow>()).results);
}

/** Active-status events overlapping [start, end): titles only, so the picker can say who holds the venue. */
export async function busyVenues(actor: Actor, start: string, end: string, excludeEventId?: string): Promise<BusyRow[]> {
  requireActorRole(actor, "coordinator", "admin");
  return guard(async () => (await getDb().prepare(
    "SELECT e.venue_id, e.title AS event_title, e.starts_at, e.ends_at FROM events e " +
    "WHERE e.venue_id IS NOT NULL AND e.status IN " + ACTIVE + " AND e.starts_at < ?2 AND ?1 < e.ends_at AND e.id <> COALESCE(?3, '') " +
    "ORDER BY e.starts_at").bind(start, end, excludeEventId ?? null).all<BusyRow>()).results);
}

/** Resources with current use over [from, to) (default now to +1 day) and the largest single future reservation. */
export async function listResources(actor: Actor, from?: string, to?: string): Promise<ResourceRow[]> {
  requireActorRole(actor, "coordinator", "admin");
  const now = new Date();
  const f = from ?? now.toISOString(), t = to ?? new Date(now.getTime() + 86_400_000).toISOString();
  // ponytail: reserved_peak is the largest single future reservation, not the true overlapping sum; sweep only if needed.
  return guard(async () => (await getDb().prepare(
    "SELECT r.id, r.name, r.quantity, r.active, " +
    "COALESCE((SELECT sum(a.quantity) FROM resource_allocations a JOIN events e ON e.id = a.event_id " +
    "WHERE a.resource_id = r.id AND e.status IN " + ACTIVE + " AND e.starts_at < ?2 AND ?1 < e.ends_at), 0) AS in_use, " +
    "COALESCE((SELECT max(a.quantity) FROM resource_allocations a JOIN events e ON e.id = a.event_id " +
    "WHERE a.resource_id = r.id AND e.status IN " + ACTIVE + " AND e.ends_at > ?3), 0) AS reserved_peak " +
    "FROM resources r ORDER BY r.active DESC, r.name").bind(f, t, now.toISOString()).all<ResourceRow>()).results);
}

function name80(n: unknown): string {
  const s = typeof n === "string" ? n.trim() : "";
  if (!s) throw bad("Give it a name.");
  if (s.length > 80) throw bad("Keep the name to 80 characters or fewer.");
  return s;
}
const whole = (n: unknown, what: string) => {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) throw bad(`${what} must be a whole number, 1 or more.`);
  return n;
};

/** ADMIN-03: add or edit a venue; retiring sets active 0, nothing is deleted. */
export async function saveVenue(actor: Actor, v: { id?: string; name: string; capacity: number; location?: string | null; active: boolean }): Promise<string> {
  requireActorRole(actor, "admin");
  const name = name80(v.name), capacity = whole(v.capacity, "Capacity");
  const loc = v.location?.trim() || null, active = v.active ? 1 : 0;
  const db = getDb();
  if (!v.id) {
    const id = crypto.randomUUID();
    await guard(() => db.prepare("INSERT INTO venues (id, name, capacity, location, active) VALUES (?1,?2,?3,?4,?5)").bind(id, name, capacity, loc, active).run());
    return id;
  }
  const r = await guard(() => db.prepare("UPDATE venues SET name = ?2, capacity = ?3, location = ?4, active = ?5 WHERE id = ?1").bind(v.id, name, capacity, loc, active).run());
  if (r.meta.changes === 0) throw bad("That venue no longer exists. Refresh the page.");
  return v.id;
}

/** ADMIN-03: add or edit a resource; quantity cannot drop below what future events already reserve. */
export async function saveResource(actor: Actor, v: { id?: string; name: string; quantity: number; active: boolean }): Promise<string> {
  requireActorRole(actor, "admin");
  const name = name80(v.name), quantity = whole(v.quantity, "Quantity"), active = v.active ? 1 : 0;
  const db = getDb();
  if (!v.id) {
    const id = crypto.randomUUID();
    await guard(() => db.prepare("INSERT INTO resources (id, name, quantity, active) VALUES (?1,?2,?3,?4)").bind(id, name, quantity, active).run());
    return id;
  }
  const peak = await guard(() => db.prepare(
    "SELECT COALESCE(max(a.quantity), 0) AS p FROM resource_allocations a JOIN events e ON e.id = a.event_id " +
    "WHERE a.resource_id = ?1 AND e.status IN " + ACTIVE + " AND e.ends_at > ?2").bind(v.id, new Date().toISOString()).first<{ p: number }>());
  if (quantity < (peak?.p ?? 0)) throw bad(`${peak!.p} are already reserved for events. Choose ${peak!.p} or more.`);
  const r = await guard(() => db.prepare("UPDATE resources SET name = ?2, quantity = ?3, active = ?4 WHERE id = ?1").bind(v.id, name, quantity, active).run());
  if (r.meta.changes === 0) throw bad("That resource no longer exists. Refresh the page.");
  return v.id;
}
