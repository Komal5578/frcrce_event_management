import { dayKey } from "@/lib/format";
import { BOOKABLE_HOURS_PER_DAY, isLowReg, isOverdue } from "@/lib/domain/rules";

type Ev = { id: string; title: string; status: string; venue_id: string | null; starts_at: string | null; ends_at: string | null; department: string | null; capacity: number | null; confirmed: number };
type Ven = { id: string; name: string; active: number };
type Task = { due_at: string | null; status: string };
export type Bar = { label: string; value: number; text: string; detail?: string };
export type Stats = {
  pendingCount: number; eventsThisMonth: number; openCount: number; overallPct: number; overallText: string;
  venues: Bar[]; departments: Bar[]; lowReg: { id: string; title: string }[]; overdueCount: number;
};

const HELD = ["pending", "approved", "open", "ongoing", "completed"];
const num = (n: number) => String(Math.round(n * 10) / 10);

export function stats(events: Ev[], venues: Ven[], tasks: Task[], now: Date): Stats {
  const month = dayKey(now.toISOString()).slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const capHours = BOOKABLE_HOURS_PER_DAY * new Date(Date.UTC(y, m, 0)).getUTCDate();
  const inMonth = events.filter((e) => e.starts_at && e.status !== "cancelled" && dayKey(e.starts_at).startsWith(month));

  const hours = new Map<string, number>();
  for (const e of inMonth)
    if (e.venue_id && e.starts_at && e.ends_at && HELD.includes(e.status))
      hours.set(e.venue_id, (hours.get(e.venue_id) ?? 0) + (Date.parse(e.ends_at) - Date.parse(e.starts_at)) / 3_600_000);

  const shown = venues.filter((v) => v.active || hours.has(v.id));
  const bars = shown.map((v) => {
    const h = hours.get(v.id) ?? 0;
    return { label: v.name, value: Math.round((h / capHours) * 100), text: `${Math.round((h / capHours) * 100)}%`, detail: `${num(h)} of ${capHours} hours` };
  }).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  const activeCount = venues.filter((v) => v.active).length;
  const total = [...hours.values()].reduce((s, h) => s + h, 0);
  const overallPct = activeCount ? Math.round((total / (capHours * activeCount)) * 100) : 0;

  const dept = new Map<string, number>();
  for (const e of inMonth) { const d = e.department?.trim() || "No department"; dept.set(d, (dept.get(d) ?? 0) + 1); }

  return {
    pendingCount: events.filter((e) => e.status === "pending").length,
    eventsThisMonth: inMonth.length,
    openCount: events.filter((e) => e.status === "open").length,
    overallPct, overallText: `${overallPct}%`,
    venues: bars,
    departments: [...dept].map(([label, value]) => ({ label, value, text: String(value) })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    lowReg: events.filter((e) => isLowReg(e, now)).map((e) => ({ id: e.id, title: e.title })),
    overdueCount: tasks.filter((t) => isOverdue(t, now)).length,
  };
}
