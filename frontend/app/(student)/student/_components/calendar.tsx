import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MyRegistration } from "@/lib/domain/people";
import { dayKey, formatDate, formatTime } from "@/lib/format";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const live = (r: MyRegistration) => (r.reg_status === "confirmed" || r.reg_status === "waitlisted") && !!r.starts_at && r.event_status !== "cancelled";

/** Registered dates, agenda (default) or month grid. State lives in the URL (GET forms), no client JS. */
export function Calendar({ regs, now, view, month }: { regs: MyRegistration[]; now: Date; view: "agenda" | "month"; month: string }) {
  const mine = regs.filter(live);
  return (
    <section aria-label="Calendar" className="flex flex-col gap-4">
      <form method="get" action="/student/mine" className="flex gap-2" aria-label="Calendar view">
        {(["agenda", "month"] as const).map((v) => (
          <button key={v} name="view" value={v} aria-pressed={view === v} type="submit"
            className={`inline-flex min-h-11 items-center rounded-control border px-4 text-label font-semibold ${view === v ? "border-ink bg-panel" : "border-border-card bg-surface"}`}>
            {v === "agenda" ? "Agenda" : "Month"}
          </button>
        ))}
      </form>
      {view === "month" ? <Month mine={mine} now={now} month={month} /> : <Agenda mine={mine} />}
    </section>
  );
}

function Agenda({ mine }: { mine: MyRegistration[] }) {
  const days = new Map<string, MyRegistration[]>();
  for (const r of [...mine].sort((a, b) => a.starts_at!.localeCompare(b.starts_at!))) {
    const k = dayKey(r.starts_at!);
    days.set(k, [...(days.get(k) ?? []), r]);
  }
  if (days.size === 0) return <p className="text-body">No registered dates yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {[...days.entries()].map(([k, list]) => (
        <div key={k}>
          <h3 className="text-label font-semibold">{formatDate(list[0].starts_at!)}</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {list.map((r) => (
              <li key={r.event_id} className="flex flex-wrap items-center gap-2 text-body">
                <span>{formatTime(r.starts_at!)}</span>
                <Link href={`/student/events/${r.event_id}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline">{r.title}</Link>
                {r.venue_name && <span>{r.venue_name}</span>}
                <StatusBadge status={r.reg_status === "waitlisted" ? "waitlisted" : "registered"} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Month({ mine, now, month }: { mine: MyRegistration[]; now: Date; month: string }) {
  const [y, m] = month.split("-").map(Number);
  const step = (d: number) => { const t = new Date(Date.UTC(y, m - 1 + d, 1)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`; };
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const today = dayKey(now.toISOString());
  const byDay = new Map<string, MyRegistration[]>();
  for (const r of mine) byDay.set(dayKey(r.starts_at!), [...(byDay.get(dayKey(r.starts_at!)) ?? []), r]);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <form method="get" action="/student/mine"><input type="hidden" name="view" value="month" />
          <button name="m" value={step(-1)} className="inline-flex min-h-11 items-center rounded-control border border-border-card px-4 text-label font-semibold">Previous month</button></form>
        <h2 aria-live="polite" className="text-heading font-semibold">{MONTHS[m - 1]} {y}</h2>
        <form method="get" action="/student/mine"><input type="hidden" name="view" value="month" />
          <button name="m" value={step(1)} className="inline-flex min-h-11 items-center rounded-control border border-border-card px-4 text-label font-semibold">Next month</button></form>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-label font-semibold" aria-hidden="true">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <ul className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <li key={`b${i}`} />;
          const key = `${month}-${String(d).padStart(2, "0")}`;
          const list = byDay.get(key) ?? [];
          const isToday = key === today;
          const dow = SHORT_DAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
          const label = `${dow} ${d} ${MONTHS[m - 1]}, ${list.length} ${list.length === 1 ? "event" : "events"}`;
          const cls = `flex min-h-11 flex-col items-center justify-center rounded-control border text-label ${isToday ? "border-2 border-ink" : "border-border-card"} ${list.length ? "bg-panel font-semibold" : ""}`;
          const inner = (<>
            <span aria-hidden="true">{d}</span>
            {isToday && <span className="sr-only">Today</span>}
            {list.length > 0 && <span aria-hidden="true">{list.length} {list.length === 1 ? "event" : "events"}</span>}
          </>);
          return (
            <li key={key}>
              {list.length ? <Link href={`/student/events/${list[0].event_id}`} aria-label={label} className={cls}>{inner}</Link>
                : <div role="img" aria-label={label} className={cls}>{inner}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
