import { ChevronRight, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { Tag, statusToTagVariant } from "@/components/board/Tag";
import { dateBlock, fmtDay, fmtRange } from "@/lib/format";
import { eventStatus, regStatus, seatsLeft } from "@/lib/status";
import type { EventItem } from "@/lib/types";

/** What, when, where, seats left. Calm and readable student card. */
export function EventCard({ e }: { e: EventItem }) {
  const { day, mon } = dateBlock(e.starts_at);
  const left = seatsLeft(e);
  const fill = e.capacity ? Math.min(100, Math.round(((e.confirmed ?? 0) / e.capacity) * 100)) : 0;
  const status = eventStatus(e);

  return (
    <Link
      href={`/student/events/${e.id}`}
      className="group block rounded-xl bg-white p-4.5 border-[1.5px] border-[#1E1A17]/25 shadow-sm transition-all duration-150 hover:border-[#1E1A17] hover:shadow-md hover:-translate-y-0.5 active:scale-[.99]"
    >
      <div className="flex gap-4">
        {/* Date block: tan noticeboard chip */}
        <div
          className="grid size-15 shrink-0 place-content-center rounded-lg bg-[#D9CBB3] border border-[#1E1A17]/30 text-center text-[#1E1A17]"
          aria-hidden
        >
          <span className="num font-grotesk text-2xl font-black leading-none">{day}</span>
          <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wider">{mon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-grotesk text-lg font-bold leading-snug tracking-[-0.01em] text-[#1E1A17] group-hover:text-[#EF4B35] transition-colors">
            {e.title}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#1E1A17]/75">
            <Clock className="size-3.5 shrink-0 text-[#1E1A17]/50" aria-hidden />
            <span>
              <span className="sr-only">When: </span>
              {fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)}
            </span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#1E1A17]/75">
            <MapPin className="size-3.5 shrink-0 text-[#1E1A17]/50" aria-hidden />
            <span>
              <span className="sr-only">Where: </span>
              {e.venue_name ?? "Venue to be set"}
            </span>
          </p>
        </div>
      </div>

      {left !== null ? (
        <div className="mt-3.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1E1A17]/10" aria-hidden>
            <div
              className="h-full rounded-full bg-[#1E1A17] transition-[width] duration-700"
              style={{ width: `${fill}%` }}
            />
          </div>
          <p className="num mt-1.5 text-xs font-bold text-[#1E1A17]/70">
            {left === 0 ? "No seats left (Waitlist only)" : `${left} of ${e.capacity} seats remaining`}
          </p>
        </div>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E1A17]/10 pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {e.coordinator_name || e.department ? (
            <span className="font-grotesk text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F2B93B]/25 border border-[#1E1A17]/30 text-[#1E1A17]">
              {e.coordinator_name ?? e.department}
            </span>
          ) : null}
          {e.type ? (
            <span className="font-grotesk text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#D9CBB3]/40 border border-[#1E1A17]/25 text-[#1E1A17]/85">
              {e.type}
            </span>
          ) : null}
          <Tag variant={statusToTagVariant(status)} label={status} />
          {e.my_reg && e.my_reg !== "cancelled" ? (
            <Tag
              variant={statusToTagVariant(regStatus(e.my_reg))}
              label={
                e.my_reg === "waitlisted" && e.my_waitlist_pos
                  ? `Waitlist #${e.my_waitlist_pos}`
                  : e.my_reg
              }
            />
          ) : null}
        </div>
        <span className="flex min-h-9 items-center gap-0.5 text-xs font-extrabold text-[#1E1A17] group-hover:text-[#EF4B35]">
          View details <ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
