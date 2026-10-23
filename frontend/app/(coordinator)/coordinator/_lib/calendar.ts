// Pure calendar maths for the month grid and agenda (display-zone day keys from lib/format).
import { dayKey } from "@/lib/format";

export const currentMonth = (now: Date) => dayKey(now.toISOString()).slice(0, 7);
export const validMonth = (s: unknown): s is string => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export function shiftMonth(ym: string, delta: number): string {
  const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
const utc = (ym: string, day = 1) => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, day));
export const monthTitle = (ym: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(utc(ym));
export const dayLabel = (key: string, n: number) =>
  `${new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }).format(utc(key.slice(0, 7), +key.slice(8)))
    .replace(/^(\w+),? /, "$1 ")}, ${n} ${n === 1 ? "event" : "events"}`;

/** Day keys of the month in Monday-first weeks; null pads the first and last week. */
export function monthCells(ym: string): (string | null)[] {
  const first = utc(ym);
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Events with a start time, grouped by display-zone day, in time order. Only the given month. */
export function groupByDay<T extends { starts_at: string | null }>(events: T[], ym: string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  const sorted = events.filter((e): e is T & { starts_at: string } => !!e.starts_at).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  for (const e of sorted) {
    const k = dayKey(e.starts_at);
    if (k.startsWith(ym)) out.set(k, [...(out.get(k) ?? []), e]);
  }
  return out;
}
