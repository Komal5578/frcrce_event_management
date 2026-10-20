// Pure: split venues into "free for your slot" and "not available" with a plain reason (C2, never hidden).
import { formatTime } from "@/lib/format";

type V = { id: string; name: string; capacity: number; active: number };
type Busy = { venue_id: string; event_title: string; starts_at: string; ends_at: string };
export type VenueOption = { id: string; name: string; capacity: number; fits: string };
export type VenueNo = { id: string; name: string; capacity: number; reason: string; clash: boolean };

export function venueGroups(venues: V[], freeIds: Set<string>, busy: Busy[], seats: number | null) {
  const free: VenueOption[] = [];
  const unavailable: VenueNo[] = [];
  for (const v of venues) {
    const b = busy.find((x) => x.venue_id === v.id);
    const no = (reason: string, clash = false) => unavailable.push({ id: v.id, name: v.name, capacity: v.capacity, reason, clash });
    if (!v.active) no("Not in use");
    else if (!freeIds.has(v.id))
      no(b ? `Booked by ${b.event_title}, ${formatTime(b.starts_at)} to ${formatTime(b.ends_at)}` : "Booked for this time", true);
    else if (seats && v.capacity < seats) no(`Capacity ${v.capacity} is below your ${seats} seats`);
    else free.push({ id: v.id, name: v.name, capacity: v.capacity, fits: seats ? `fits your ${seats} seats` : "" });
  }
  return { free, unavailable };
}

/** Live Summary venue line: state in words. */
export function venueState(
  venueId: string | null, venues: V[], freeIds: Set<string> | null, busy: Busy[], seats: number | null,
): { text: string; ok: boolean } {
  const v = venues.find((x) => x.id === venueId);
  if (!v) return { text: "Not chosen", ok: false };
  if (!freeIds) return { text: `${v.name}, capacity ${v.capacity}. Set the time to check it is free`, ok: false };
  const g = venueGroups([v], freeIds, busy, seats);
  if (g.free.length) return { text: `${v.name}, capacity ${v.capacity}: free for this time`, ok: true };
  return { text: `${v.name}: ${g.unavailable[0].reason}`, ok: false };
}
