"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { fmtDay, fmtTime, sameDay } from "@/lib/format";
import { eventStatus, STATUS_META } from "@/lib/status";
import type { EventItem } from "@/lib/types";

/** Month grid on md+, agenda list on phones. Chips carry icon + short word, never colour alone. */
export function MonthCalendar({ events, href, clashes }: { events: EventItem[]; href: (e: EventItem) => string; clashes?: Set<string> }) {
  const [cur, setCur] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const today = new Date();
  const first = new Date(cur);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => { const d = new Date(cur); d.setDate(1 - lead + i); return d; }), [cur, lead]);
  const inMonth = events.filter((e) => e.starts_at && new Date(e.starts_at).getMonth() === cur.getMonth() && new Date(e.starts_at).getFullYear() === cur.getFullYear()).sort((a, b) => +new Date(a.starts_at!) - +new Date(b.starts_at!));
  const shift = (n: number) => setCur((c) => { const d = new Date(c); d.setMonth(d.getMonth() + n); return d; });
  const label = cur.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold" aria-live="polite">{label}</h2>
        <div className="flex gap-1.5">
          <button aria-label="Previous month" onClick={() => shift(-1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-surface border border-line-strong hover:bg-surface-2"><ChevronLeft className="size-5" aria-hidden /></button>
          <button onClick={() => setCur(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })} className="min-h-11 rounded-xl bg-surface px-3.5 text-sm font-bold border border-line-strong hover:bg-surface-2">Today</button>
          <button aria-label="Next month" onClick={() => shift(1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-surface border border-line-strong hover:bg-surface-2"><ChevronRight className="size-5" aria-hidden /></button>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl bg-surface shadow-card border border-line md:block">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-xs font-bold text-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const evs = events.filter((e) => e.starts_at && sameDay(new Date(e.starts_at), d));
            const out = d.getMonth() !== cur.getMonth();
            const isToday = sameDay(d, today);
            return (
              <div key={i} className={cn("min-h-28 border-b border-r border-line p-1.5", out && "bg-surface-2/70", i % 7 === 6 && "border-r-0", i >= 35 && "border-b-0")}>
                <p className={cn("num mb-1 grid size-7 place-items-center rounded-full text-[13px] font-bold", isToday ? "bg-brand text-on-brand" : out ? "text-faint" : "text-ink")}>{d.getDate()}</p>
                <div className="space-y-1">
                  {evs.slice(0, 3).map((e) => {
                    const s = eventStatus(e); const Icon = STATUS_META[s].icon;
                    return (
                      <Link key={e.id} href={href(e)} data-s={s} title={`${e.title} — ${STATUS_META[s].label}${clashes?.has(e.id) ? ", clash" : ""}`} data-dense className="status flex min-h-6 items-center gap-1 truncate [@media(pointer:coarse)]:min-h-11 rounded-md px-1.5 py-0.5 text-[12px] font-semibold hover:brightness-95">
                        <Icon className="size-3 shrink-0" aria-hidden /><span className="truncate">{e.title}</span>
                        {clashes?.has(e.id) ? <span className="ml-auto shrink-0 font-extrabold">Clash</span> : null}
                      </Link>
                    );
                  })}
                  {evs.length > 3 ? <p className="px-1 text-xs font-semibold text-muted">+{evs.length - 3} more</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="space-y-2.5 md:hidden" aria-label={`Events in ${label}`}>
        {inMonth.length === 0 ? <li className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-muted">No events this month.</li> : null}
        {inMonth.map((e) => (
          <li key={e.id}><Link href={href(e)} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3.5 border border-line"><span className="min-w-0"><span className="block truncate font-bold">{e.title}</span><span className="text-sm text-muted">{fmtDay(e.starts_at)}, {fmtTime(e.starts_at)}</span></span><StatusBadge status={eventStatus(e)} /></Link></li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Status key">
        {(["pending", "approved", "open", "ongoing", "completed", "cancelled"] as const).map((s) => <StatusBadge key={s} status={s} />)}
      </div>
    </div>
  );
}
