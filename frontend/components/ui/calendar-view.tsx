"use client";

import Link from "next/link";
import { StatusBadge, type StatusKey } from "./status-badge";
import { dayKey, formatDate, formatTime } from "@/lib/format";

export type CalendarEventItem = {
  id: string;
  title: string;
  status?: string;
  startsAt: string;
  venueName?: string | null;
  href?: string;
};

export type CalendarViewProps = {
  events: CalendarEventItem[];
  month: string; // "YYYY-MM"
  view: "agenda" | "month";
  now?: Date;
  baseHref: string; // e.g. "/coordinator/calendar" or "/student/mine"
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BTN =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-ui bg-surface px-4 py-2 text-label font-semibold text-ink transition-colors hover:bg-panel";

export function CalendarView({
  events,
  month,
  view,
  now = new Date(),
  baseHref,
}: CalendarViewProps) {
  const [y, m] = month.split("-").map(Number);
  const today = dayKey(now.toISOString());
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const shift = (delta: number) => {
    const t = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  };

  const navHref = (targetMonth: string) => {
    const sep = baseHref.includes("?") ? "&" : "?";
    return `${baseHref}${sep}month=${targetMonth}&view=${view}`;
  };

  // Group events by day
  const byDay = new Map<string, CalendarEventItem[]>();
  for (const ev of events) {
    if (!ev.startsAt) continue;
    const k = dayKey(ev.startsAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(ev);
  }

  // Month grid calculations
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const totalDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <section aria-label="Calendar" className="flex flex-col gap-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={navHref(shift(-1))} className={BTN} aria-label="Previous month">
            Previous
          </Link>
          <h2 aria-live="polite" className="min-w-44 text-center text-heading font-bold text-ink">
            {MONTHS[m - 1]} {y}
          </h2>
          <Link href={navHref(shift(1))} className={BTN} aria-label="Next month">
            Next
          </Link>
          {month !== currentMonthKey && (
            <Link href={navHref(currentMonthKey)} className={BTN}>
              Today
            </Link>
          )}
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 rounded-control border border-border-card bg-surface p-1">
          <Link
            href={`${baseHref}${baseHref.includes("?") ? "&" : "?"}month=${month}&view=agenda`}
            aria-pressed={view === "agenda"}
            className={[
              "inline-flex min-h-9 items-center justify-center rounded-control px-3 text-label font-medium transition-colors",
              view === "agenda" ? "bg-accent text-accent-contrast font-semibold" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            Agenda
          </Link>
          <Link
            href={`${baseHref}${baseHref.includes("?") ? "&" : "?"}month=${month}&view=month`}
            aria-pressed={view === "month"}
            className={[
              "inline-flex min-h-9 items-center justify-center rounded-control px-3 text-label font-medium transition-colors",
              view === "month" ? "bg-accent text-accent-contrast font-semibold" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            Month
          </Link>
        </div>
      </div>

      {/* Month grid view */}
      {view === "month" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-7 gap-1 text-center text-label font-semibold text-muted" aria-hidden="true">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <ul className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <li key={`empty-${i}`} aria-hidden="true" />;
              const dateStr = `${month}-${String(d).padStart(2, "0")}`;
              const dayEvents = byDay.get(dateStr) ?? [];
              const isToday = dateStr === today;
              const dow = SHORT_DAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
              const label = `${dow} ${d} ${MONTHS[m - 1]}, ${dayEvents.length} ${
                dayEvents.length === 1 ? "event" : "events"
              }`;
              const boxStyle = [
                "flex min-h-16 flex-col items-center justify-start rounded-control border p-1 text-label transition-colors",
                isToday ? "border-2 border-accent" : "border-border-card",
                dayEvents.length > 0 ? "bg-surface hover:bg-panel" : "bg-panel text-muted",
              ].join(" ");

              const content = (
                <>
                  <span className={`text-fine font-semibold ${isToday ? "text-accent" : "text-ink"}`}>
                    {d}
                  </span>
                  {isToday && <span className="sr-only">Today</span>}
                  {dayEvents.length > 0 && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-accent/15 px-1.5 py-0.5 text-fine font-semibold text-accent">
                      {dayEvents.length}
                    </span>
                  )}
                </>
              );

              return (
                <li key={dateStr}>
                  {dayEvents.length > 0 && dayEvents[0].href ? (
                    <Link href={dayEvents[0].href} aria-label={label} className={boxStyle}>
                      {content}
                    </Link>
                  ) : (
                    <div role="img" aria-label={label} className={boxStyle}>
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Agenda list view */}
      {view === "agenda" && (
        <div className="flex flex-col gap-6">
          {byDay.size === 0 ? (
            <div className="rounded-card border border-border-card bg-surface p-8 text-center">
              <h3 className="text-heading font-semibold text-ink">No events this month</h3>
              <p className="mt-1 text-label text-muted">
                Navigate to another month or create a new event to view scheduled items.
              </p>
            </div>
          ) : (
            [...byDay.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, dayList]) => (
                <div key={dateKey} className="flex flex-col gap-2">
                  <h3 className="border-b border-border-card pb-1 text-subheading font-bold text-ink">
                    {formatDate(dayList[0].startsAt)}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {dayList.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-card bg-surface p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-label font-semibold tabular-nums text-muted">
                              {formatTime(ev.startsAt)}
                            </span>
                            {ev.href ? (
                              <Link
                                href={ev.href}
                                className="text-label font-bold text-ink hover:text-accent hover:underline"
                              >
                                {ev.title}
                              </Link>
                            ) : (
                              <span className="text-label font-bold text-ink">{ev.title}</span>
                            )}
                          </div>
                          {ev.venueName && (
                            <span className="text-fine text-muted">{ev.venueName}</span>
                          )}
                        </div>
                        {ev.status && <StatusBadge status={ev.status as StatusKey} />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </div>
      )}
    </section>
  );
}
