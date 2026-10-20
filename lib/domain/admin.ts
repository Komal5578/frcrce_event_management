import { getDb } from "@/lib/db";
import { guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";

export type BookingRow = {
  event_id: string; title: string; status: string; department: string | null; venue_id: string; venue_name: string;
  venue_active: number; starts_at: string; ends_at: string; conflict: string | null;
};

/** Admin calendar rows: events with a venue starting in [from, to), cancelled ones left out, conflicts flagged. */
export async function listBookings(actor: Actor, from: string, to: string): Promise<BookingRow[]> {
  requireActorRole(actor, "admin");
  const rows = await guard(async () => (await getDb().prepare(
    "SELECT e.id AS event_id, e.title, e.status, e.department, e.venue_id, v.name AS venue_name, v.active AS venue_active, e.starts_at, e.ends_at " +
    "FROM events e JOIN venues v ON v.id = e.venue_id WHERE e.starts_at >= ?1 AND e.starts_at < ?2 AND e.status <> 'cancelled' " +
    "ORDER BY e.starts_at, e.id").bind(from, to).all<Omit<BookingRow, "conflict">>()).results);
  return flagConflicts(rows);
}

const NOT_HELD = ["draft", "returned"];
const DONE = ["completed", "cancelled"];

/**
 * [ASSUMED A2] Active-active overlaps are impossible (DB triggers), so a "conflict" is a real condition only:
 * an overlap on one venue where at least one side is a draft/returned (will clash on submit), or a live event on a retired venue.
 */
export function flagConflicts(rows: Omit<BookingRow, "conflict">[]): BookingRow[] {
  return rows.map((r) => {
    let conflict: string | null = null;
    if (!DONE.includes(r.status) && !r.venue_active) conflict = `${r.venue_name} is retired. Move this event to another venue.`;
    else {
      const o = rows.find((x) => x.event_id !== r.event_id && x.venue_id === r.venue_id && !DONE.includes(x.status) && !DONE.includes(r.status) &&
        (NOT_HELD.includes(x.status) || NOT_HELD.includes(r.status)) && x.starts_at < r.ends_at && r.starts_at < x.ends_at);
      if (o) conflict = `Overlaps "${o.title}" at ${r.venue_name}.`;
    }
    return { ...r, conflict };
  });
}
