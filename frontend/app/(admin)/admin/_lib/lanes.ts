import { dayKey } from "@/lib/format";

type B = { event_id: string; venue_id: string; starts_at: string; conflict?: string | null };
const addDays = (key: string, n: number) => new Date(Date.parse(key + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

/** The 7 day keys (Monday first) of week `weekIndex` of the month starting at monthStart ("YYYY-MM-01"). */
export function weekColumns(monthStart: string, weekIndex: number): string[] {
  const dow = (new Date(monthStart + "T00:00:00Z").getUTCDay() + 6) % 7; // Monday = 0
  const first = addDays(monthStart, -dow + weekIndex * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** venue id -> day key -> bookings; a booking sits on its start day. */
export function lanes<T extends B>(bookings: T[]): Map<string, Map<string, T[]>> {
  const out = new Map<string, Map<string, T[]>>();
  for (const b of bookings) {
    const days = out.get(b.venue_id) ?? new Map<string, T[]>();
    const k = dayKey(b.starts_at);
    days.set(k, [...(days.get(k) ?? []), b]);
    out.set(b.venue_id, days);
  }
  return out;
}

export function agendaGroups<T extends B>(bookings: T[]): { day: string; items: T[] }[] {
  const g = new Map<string, T[]>();
  for (const b of [...bookings].sort((a, c) => a.starts_at.localeCompare(c.starts_at))) {
    const k = dayKey(b.starts_at);
    g.set(k, [...(g.get(k) ?? []), b]);
  }
  return [...g].map(([day, items]) => ({ day, items }));
}

export const noConflicts = (bookings: B[]) => bookings.every((b) => !b.conflict);
