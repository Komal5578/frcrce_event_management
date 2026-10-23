import Link from "next/link";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { dayKey, formatTime } from "@/lib/format";
import { currentMonth, dayLabel, groupByDay, monthCells, monthTitle, shiftMonth } from "../_lib/calendar";

type Ev = { id: string; title: string; status: string; starts_at: string | null; venue_name: string | null };
const BTN = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-ui bg-surface px-4 py-2 text-label font-semibold text-ink hover:bg-panel";
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Read-only calendar: agenda always, month grid on 768px+ when view=month. Server-rendered from ?month and ?view. */
export function Calendar({ events, month, view, now }: { events: Ev[]; month: string; view: "agenda" | "month"; now: Date }) {
  const byDay = groupByDay(events, month);
  const today = dayKey(now.toISOString());
  const href = (m: string) => `/coordinator/calendar?month=${m}&view=${view}`;
  const evLink = (e: Ev) => (e.status === "draft" || e.status === "returned" ? `/coordinator/${e.id}/edit` : `/coordinator/${e.id}`);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href(shiftMonth(month, -1))} className={BTN}>Previous month</Link>
          <h2 aria-live="polite" className="min-w-40 text-center text-heading font-semibold">{monthTitle(month)}</h2>
          <Link href={href(shiftMonth(month, 1))} className={BTN}>Next month</Link>
          {month !== currentMonth(now) && <Link href={`/coordinator/calendar?view=${view}`} className={BTN}>This month</Link>}
        </div>
        <form method="get" className="hidden gap-2 md:flex" aria-label="Calendar view">
          <input type="hidden" name="month" value={month} />
          <button type="submit" name="view" value="agenda" aria-pressed={view === "agenda"} className={`${BTN} aria-pressed:border-2 aria-pressed:border-accent`}>Agenda</button>
          <button type="submit" name="view" value="month" aria-pressed={view === "month"} className={`${BTN} aria-pressed:border-2 aria-pressed:border-accent`}>Month</button>
        </form>
      </div>

      {view === "month" && (
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 text-center text-label font-semibold text-muted" aria-hidden="true">
            {WEEK.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthCells(month).map((k, i) => {
              if (!k) return <div key={i} />;
              const n = byDay.get(k)?.length ?? 0;
              const box = `flex min-h-14 flex-col items-center justify-center rounded-control p-1 text-label ${k === today ? "border-2 border-ink" : "border border-border-card"}`;
              const inner = (
                <>
                  <span className="font-semibold">{+k.slice(8)}</span>
                  {k === today && <span className="sr-only">Today</span>}
                  {n > 0 && <span>{n} {n === 1 ? "event" : "events"}</span>}
                </>
              );
              return n > 0
                ? <a key={k} href={`#day-${k}`} aria-label={dayLabel(k, n)} className={`${box} bg-surface hover:bg-panel`}>{inner}</a>
                : <div key={k} className={`${box} bg-panel text-muted`}>{inner}</div>;
            })}
          </div>
        </div>
      )}

      {byDay.size === 0 ? (
        <div className="rounded-control border border-border-card bg-panel p-6">
          <h3 className="text-heading font-semibold">No events in this month</h3>
          <p className="text-body">Pick another month or start a new event.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...byDay].map(([k, list]) => (
            <section key={k} id={`day-${k}`} aria-labelledby={`h-${k}`}>
              <h3 id={`h-${k}`} className="text-body font-semibold">{dayLabel(k, list.length).replace(/, \d+ events?$/, "")}{k === today ? " (today)" : ""}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {list.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-control border border-border-card bg-panel p-3">
                    <span className="text-label font-semibold">{formatTime(e.starts_at!)}</span>
                    <Link href={evLink(e)} className="text-body font-semibold underline hover:text-accent">{e.title}</Link>
                    <span className="text-label text-muted">{e.venue_name ?? "Venue not chosen"}</span>
                    <StatusBadge status={e.status as StatusKey} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
