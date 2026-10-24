import type { BookingItem } from "./types";

const HOLDS = ["approved", "open", "ongoing"];

/** Clash check (computed): another approved/open/ongoing booking at the same venue overlapping [start, end). */
export function clashesFor(b: { event_id?: string; venue_id?: string | null; starts_at?: string | null; ends_at?: string | null }, all: BookingItem[], holds: string[] = HOLDS) {
  if (!b.venue_id || !b.starts_at || !b.ends_at) return [];
  const s = +new Date(b.starts_at), e = +new Date(b.ends_at);
  return all.filter((o) => o.event_id !== b.event_id && o.venue_id === b.venue_id && holds.includes(o.status) && +new Date(o.starts_at) < e && s < +new Date(o.ends_at));
}

/** Other pending requests for the same venue and time. Pending may overlap; approving one makes the rest clash. */
export const rivalsFor = (b: Parameters<typeof clashesFor>[0], all: BookingItem[]) => clashesFor(b, all, ["pending"]);
