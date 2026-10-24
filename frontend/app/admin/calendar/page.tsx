"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/shell/app-shell";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { fmtTime, sameDay } from "@/lib/format";
import { STATUS_META, type StatusKey } from "@/lib/status";
import type { BookingItem, VenueItem } from "@/lib/types";

const monday = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

export default function AdminCalendar() {
  const [start, setStart] = useState(() => monday(new Date()));
  const [all, setAll] = useState(true);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const { data: venues } = useSWR<VenueItem[]>("/api/venues");
  const { data: bookings, error, mutate } = useSWR<BookingItem[]>(`/api/admin/bookings?from_time=${start.toISOString()}&to_time=${end.toISOString()}`);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const shown = useMemo(() => (bookings ?? []).filter((b) => !["draft", "cancelled", "returned"].includes(b.status)), [bookings]);
  const active = (venues ?? []).filter((v) => v.active);
  const rows = active.filter((v) => all || shown.some((b) => b.venue_id === v.id));
  const empty = active.length - active.filter((v) => shown.some((b) => b.venue_id === v.id)).length;
  const conflicts = shown.filter((b) => b.conflict);
  const shift = (n: number) => setStart((s) => { const d = new Date(s); d.setDate(d.getDate() + n * 7); return d; });
  const label = `${days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <>
      <PageHeader title="Calendar" sub="Every venue, every day. Conflicts are marked with an icon and the word Clash." actions={
        <div className="flex flex-wrap items-center gap-1.5">
          <button aria-label="Previous week" onClick={() => shift(-1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-surface border border-line-strong hover:bg-surface-2"><ChevronLeft className="size-5" aria-hidden /></button>
          <span className="num min-w-36 text-center text-sm font-bold" aria-live="polite">{label}</span>
          <button aria-label="Next week" onClick={() => shift(1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-surface border border-line-strong hover:bg-surface-2"><ChevronRight className="size-5" aria-hidden /></button>
          <button onClick={() => setStart(monday(new Date()))} className="min-h-11 rounded-xl bg-surface px-3.5 text-sm font-bold border border-line-strong hover:bg-surface-2">This week</button>
        </div>
      } />

      {conflicts.length ? (
        <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--st-clash-bg)] p-4 text-[var(--st-clash-fg)]">
          <StatusBadge status="clash" label={`${conflicts.length} in this week`} />
          <span className="font-semibold">{[...new Set(conflicts.map((c) => c.title))].join(" · ")}</span>
          <Link href="/admin/approvals" className="ml-auto flex min-h-11 items-center font-bold underline">Resolve in Approvals</Link>
        </div>
      ) : null}

      {error ? <ErrorState onRetry={() => mutate()} /> : !bookings || !venues ? <Skeleton className="h-96 rounded-2xl" /> : (
        <div className="relative overflow-x-auto rounded-2xl bg-surface shadow-card border border-line">
          <table className="w-full min-w-[60rem] table-fixed border-collapse text-left">
            <caption className="sr-only">Venue bookings for {label}</caption>
            <colgroup><col className="w-56" />{days.map((_, i) => <col key={i} />)}</colgroup>
            <thead>
              <tr className="border-b border-line bg-surface-2 text-sm">
                <th scope="col" className="sticky left-0 z-10 bg-surface-2 px-4 py-3 font-semibold text-muted">Venue</th>
                {days.map((d) => <th key={+d} scope="col" className={cn("px-2 py-3 text-center font-bold", sameDay(d, new Date()) && "text-brand")}>{d.toLocaleDateString("en-GB", { weekday: "short" })} <span className="num">{d.getDate()}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0 align-top">
                  <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3 text-[15px] font-bold">{v.name}<span className="num block text-xs font-medium text-muted">Seats {v.capacity}</span></th>
                  {days.map((d) => {
                    const bs = shown.filter((b) => b.venue_id === v.id && sameDay(new Date(b.starts_at), d));
                    return (
                      <td key={+d} className={cn("min-h-16 space-y-1 p-1.5", sameDay(d, new Date()) && "bg-brand-soft/40")}>
                        {bs.map((b) => {
                          const s = (b.conflict ? "clash" : b.status) as StatusKey; const Icon = STATUS_META[s in STATUS_META ? s : "pending"].icon;
                          return (
                            <Link key={b.event_id} href={b.status === "pending" ? `/admin/approvals/${b.event_id}` : "/admin/calendar"} data-s={s in STATUS_META ? s : "pending"} title={`${b.title}, ${STATUS_META[s in STATUS_META ? s : "pending"].label}${b.conflict ? `. Clashes with ${b.conflict}` : ""}`} className="status block rounded-lg px-2 py-1.5 text-[12.5px] font-semibold leading-tight hover:brightness-95">
                              <span className="flex items-center gap-1"><Icon className="size-3 shrink-0" aria-hidden /><span className="truncate">{b.title}</span></span>
                              <span className="num block text-[11.5px] font-medium opacity-85">{fmtTime(b.starts_at)}{b.conflict ? " · Clash" : ""}</span>
                            </Link>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {bookings && venues && empty > 0 ? <button onClick={() => setAll((v) => !v)} aria-pressed={all} className="mt-3 min-h-11 rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand-soft">{all ? "Hide venues with nothing booked" : `Show ${empty} ${empty === 1 ? "venue" : "venues"} with nothing booked this week`}</button> : null}
      {bookings && rows.length === 0 ? <p className="mt-4 rounded-2xl border-2 border-dashed border-line p-8 text-center text-muted">Nothing is booked this week.</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">{(["pending", "approved", "open", "ongoing", "completed", "clash"] as const).map((s) => <StatusBadge key={s} status={s} />)}</div>
    </>
  );
}
