import { dayKey } from "@/lib/format";
import type { EventView } from "@/lib/domain/views";

export type Params = {
  q: string; week: boolean; open: boolean; seats: boolean;
  type: string; venue: string; department: string; from: string; to: string;
};
type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const WEEK_MS = 7 * 86_400_000;

/** URL -> params. No `f` marker means a first visit: This week on and the profile department preselected. */
export function parseParams(sp: Raw, defaultDepartment: string | null): Params {
  const submitted = one(sp.f) !== "";
  const date = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  return {
    q: one(sp.q).trim().slice(0, 100),
    week: submitted ? one(sp.week) === "on" : true,
    open: one(sp.open) === "on",
    seats: one(sp.seats) === "on",
    type: one(sp.type).slice(0, 60),
    venue: one(sp.venue).slice(0, 100),
    department: submitted ? one(sp.department).slice(0, 100) : (defaultDepartment ?? ""),
    from: date(one(sp.from)),
    to: date(one(sp.to)),
  };
}

const mine = (e: EventView) => e.my_reg === "confirmed" || e.my_reg === "waitlisted";

export function applyFilters(events: EventView[], p: Params, now: Date): EventView[] {
  const q = p.q.toLowerCase();
  const t = now.getTime();
  return events
    .filter((e) => {
      if (e.status === "cancelled" && !mine(e)) return false;
      if (e.status === "completed" && !mine(e)) return false; // finished events are not discoverable
      if (q && ![e.title, e.type, e.department, e.venue_name].some((s) => s?.toLowerCase().includes(q))) return false;
      if (p.week) {
        const s = e.starts_at ? new Date(e.starts_at).getTime() : NaN;
        const end = e.ends_at ? new Date(e.ends_at).getTime() : s;
        if (!(end >= t && s <= t + WEEK_MS)) return false;
      }
      if (p.open && e.status !== "open") return false;
      if (p.seats && !(e.confirmed < (e.capacity ?? 0))) return false;
      if (p.type && e.type !== p.type) return false;
      if (p.venue && e.venue_name !== p.venue) return false;
      if (p.department && e.department !== p.department) return false;
      const day = e.starts_at ? dayKey(e.starts_at) : "";
      if (p.from && !(day >= p.from)) return false;
      if (p.to && !(day <= p.to)) return false;
      return true;
    })
    .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
}

/** "Showing: this week, Computer Science. 12 events found." */
export function echoText(p: Params, count: number): string {
  const parts = [
    p.q && `matching "${p.q}"`, p.week && "this week", p.open && "open only", p.seats && "has seats",
    p.type, p.venue, p.department, p.from && `from ${p.from}`, p.to && `to ${p.to}`,
  ].filter(Boolean);
  return `Showing: ${parts.length ? parts.join(", ") : "all events"}. ${count} ${count === 1 ? "event" : "events"} found.`;
}

export const distinct = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();
