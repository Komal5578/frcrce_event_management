import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Tag, statusToTagVariant } from "@/components/board/Tag";
import { dateBlock, fmtDay, fmtRange } from "@/lib/format";
import { eventStatus } from "@/lib/status";
import type { EventItem } from "@/lib/types";

/** Low registrations: open, under 30% full, starting within 7 days */
export const isLow = (e: EventItem) =>
  e.status === "open" && !!e.capacity && (e.confirmed ?? 0) / e.capacity < 0.3 && !!e.starts_at && +new Date(e.starts_at) - Date.now() < 7 * 864e5 && +new Date(e.starts_at) > Date.now();

export function EventRow({ e, href, action }: { e: EventItem; href: string; action?: React.ReactNode }) {
  const { day, mon } = dateBlock(e.starts_at);
  const pct = e.capacity ? Math.min(100, Math.round(((e.confirmed ?? 0) / e.capacity) * 100)) : 0;
  const status = eventStatus(e);

  return (
    <div className="group flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl bg-white p-4 border-[1.5px] border-[#1E1A17]/25 shadow-sm transition hover:border-[#1E1A17]">
      <div className="hidden size-14 shrink-0 place-content-center rounded-lg bg-[#D9CBB3] border border-[#1E1A17]/30 text-center text-[#1E1A17] sm:grid" aria-hidden>
        <span className="num font-grotesk text-xl font-black leading-none">{day}</span>
        <span className="mt-0.5 text-[11px] font-bold uppercase">{mon}</span>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <Link href={href} className="flex min-h-11 items-center font-grotesk text-[17px] font-extrabold tracking-[-0.01em] text-[#1E1A17] hover:text-[#EF4B35]">
          {e.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm font-semibold text-[#1E1A17]/75">
          <span>{e.starts_at ? `${fmtDay(e.starts_at)}, ${fmtRange(e.starts_at, e.ends_at)}` : "Date and time not set yet"}</span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-[#1E1A17]/50" aria-hidden />
            {e.venue_name ?? "No venue yet"}
          </span>
        </p>
        {e.status === "returned" && e.return_reason ? (
          <p className="mt-1 text-sm font-bold text-[#EF4B35]">Returned: “{e.return_reason}”</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag variant={statusToTagVariant(status)} label={status} />
        {isLow(e) ? <Tag variant="red" label="Low RSVPs" /> : null}
      </div>
      {e.capacity ? (
        <div className="w-full sm:w-36" aria-label={`${e.confirmed} of ${e.capacity} registered`}>
          <div className="h-2 overflow-hidden rounded-full bg-[#1E1A17]/10">
            <div className="h-full rounded-full bg-[#1E1A17]" style={{ width: `${pct}%` }} />
          </div>
          <p className="num mt-1 text-xs font-bold text-[#1E1A17]/70">
            {e.confirmed ?? 0} / {e.capacity} RSVPs
          </p>
        </div>
      ) : (
        <div className="w-full text-xs font-semibold text-[#1E1A17]/60 sm:w-36">No capacity set</div>
      )}
      <div className="flex items-center max-sm:w-full">
        {action ?? (
          <Link href={href} className="flex min-h-11 items-center gap-1 rounded-lg px-3 font-grotesk text-sm font-bold text-[#1E1A17] hover:bg-[#D9CBB3]/40">
            View <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
