import { ChevronRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateBlock, fmtDay, fmtRange } from "@/lib/format";
import { eventStatus, regStatus, seatsLeft } from "@/lib/status";
import type { EventItem } from "@/lib/types";

/** What, when, where, seats left. Links to the detail only; Register lives there (ST-01). */
export function EventCard({ e }: { e: EventItem }) {
  const { day, mon } = dateBlock(e.starts_at);
  const left = seatsLeft(e);
  const fill = e.capacity ? Math.min(100, Math.round(((e.confirmed ?? 0) / e.capacity) * 100)) : 0;
  const status = eventStatus(e);
  return (
    <Link href={`/student/events/${e.id}`} className="group block rounded-2xl bg-surface p-4 shadow-card border border-line transition duration-150 hover:-translate-y-0.5 hover:ring-purple active:scale-[.985]">
      <div className="flex gap-4">
        <div className="grid size-16 shrink-0 place-content-center rounded-2xl bg-purple-soft text-center text-purple" aria-hidden>
          <span className="num text-2xl font-extrabold leading-none">{day}</span>
          <span className="mt-1 text-xs font-bold uppercase tracking-wide">{mon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-extrabold leading-snug tracking-tight text-ink">{e.title}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted"><Clock className="size-3.5 shrink-0" aria-hidden /><span><span className="sr-only">When: </span>{fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)}</span></p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-3.5 shrink-0" aria-hidden /><span><span className="sr-only">Where: </span>{e.venue_name ?? "Venue to be set"}</span></p>
        </div>
      </div>
      {left !== null ? (
        <div className="mt-3.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden><div className="h-full rounded-full bg-purple transition-[width] duration-700" style={{ width: `${fill}%` }} /></div>
          <p className="num mt-1.5 text-[13px] font-semibold text-muted">{left === 0 ? "No seats left" : `${left} of ${e.capacity} seats left`}</p>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={status} />
          {e.my_reg && e.my_reg !== "cancelled" ? <StatusBadge status={regStatus(e.my_reg)} label={e.my_reg === "waitlisted" && e.my_waitlist_pos ? `Waitlisted #${e.my_waitlist_pos}` : undefined} /> : null}
        </div>
        <span className="flex min-h-11 items-center gap-0.5 text-sm font-bold text-purple">View details <ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
      </div>
    </Link>
  );
}
