import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateBlock, fmtDay, fmtRange } from "@/lib/format";
import { eventStatus } from "@/lib/status";
import type { EventItem } from "@/lib/types";

/** Low registrations: open, under 30% full, starting within 7 days (derived from data the system holds). */
export const isLow = (e: EventItem) =>
  e.status === "open" && !!e.capacity && (e.confirmed ?? 0) / e.capacity < 0.3 && !!e.starts_at && +new Date(e.starts_at) - Date.now() < 7 * 864e5 && +new Date(e.starts_at) > Date.now();

export function EventRow({ e, href, action }: { e: EventItem; href: string; action?: React.ReactNode }) {
  const { day, mon } = dateBlock(e.starts_at);
  const pct = e.capacity ? Math.min(100, Math.round(((e.confirmed ?? 0) / e.capacity) * 100)) : 0;
  return (
    <div className="group flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-surface p-4 shadow-card border border-line transition hover:ring-brand">
      <div className="hidden size-14 shrink-0 place-content-center rounded-xl bg-brand-soft text-center text-brand sm:grid" aria-hidden>
        <span className="num text-xl font-extrabold leading-none">{day}</span><span className="mt-0.5 text-[11px] font-bold uppercase">{mon}</span>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <Link href={href} className="flex min-h-11 items-center rounded text-[17px] font-extrabold tracking-tight text-ink hover:text-brand">{e.title}</Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted"><span>{e.starts_at ? `${fmtDay(e.starts_at)}, ${fmtRange(e.starts_at, e.ends_at)}` : "Date and time not set yet"}</span><span className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{e.venue_name ?? "No venue yet"}</span></p>
        {e.status === "returned" && e.return_reason ? <p className="mt-1 text-sm font-medium text-[var(--st-returned-fg)]">Returned: “{e.return_reason}”</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={eventStatus(e)} />
        {isLow(e) ? <StatusBadge status="low" /> : null}
      </div>
      {e.capacity ? (
        <div className="w-full sm:w-36" aria-label={`${e.confirmed} of ${e.capacity} registered`}>
          <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
          <p className="num mt-1 text-[13px] font-semibold text-muted">{e.confirmed ?? 0} / {e.capacity} registered</p>
        </div>
      ) : <div className="w-full text-sm text-muted sm:w-36">No capacity set</div>}
      <div className="flex items-center max-sm:w-full">{action ?? <Link href={href} className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand-soft">View <ChevronRight className="size-4" aria-hidden /></Link>}</div>
    </div>
  );
}
