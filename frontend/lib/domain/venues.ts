import { getDb } from "@/lib/db";
import { guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";

const ACTIVE = "('pending','approved','open','ongoing')";

/** C2: active venues with no active event overlapping [start, end) (ISO UTC strings). */
export async function freeVenues(actor: Actor, start: string, end: string, excludeEventId?: string) {
  requireActorRole(actor, "coordinator", "admin");
  return guard(async () => (await getDb().prepare(
    "SELECT v.* FROM venues v WHERE v.active = 1 AND NOT EXISTS (SELECT 1 FROM events e WHERE e.venue_id = v.id " +
    "AND e.status IN " + ACTIVE + " AND e.starts_at < ?2 AND ?1 < e.ends_at AND e.id <> COALESCE(?3, '')) ORDER BY v.name")
    .bind(start, end, excludeEventId ?? null).all<{ id: string; name: string; capacity: number; location: string | null }>()).results);
}

/** C3: quantity of a resource still free for [start, end). */
export async function resourceAvailable(actor: Actor, resourceId: string, start: string, end: string, excludeEventId?: string): Promise<number> {
  requireActorRole(actor, "coordinator", "admin");
  const r = await guard(() => getDb().prepare(
    "SELECT res.quantity - COALESCE((SELECT sum(a.quantity) FROM resource_allocations a JOIN events e ON e.id = a.event_id " +
    "WHERE a.resource_id = res.id AND e.status IN " + ACTIVE + " AND e.starts_at < ?3 AND ?2 < e.ends_at AND e.id <> COALESCE(?4, '')), 0) AS left " +
    "FROM resources res WHERE res.id = ?1").bind(resourceId, start, end, excludeEventId ?? null).first<{ left: number }>());
  return r?.left ?? 0;
}
