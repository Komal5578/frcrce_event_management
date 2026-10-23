import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRange } from "@/lib/format";
import type { EventView } from "@/lib/domain/views";
import { cardModel } from "../_lib/view";
import { RegisterFlow } from "./register-flow";

/** Read order: title, badge, when, where, seats, action. A meta block, never a table. */
export function EventCard({ e, primary }: { e: EventView; primary: boolean }) {
  const m = cardModel(e);
  const when = e.starts_at && e.ends_at ? formatRange(e.starts_at, e.ends_at) : "Date to be confirmed";
  const where = e.venue_name ?? "Venue to be confirmed";
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border-card bg-surface p-4">
      <h3 className="text-heading font-semibold">
        <Link href={`/student/events/${e.id}`} className="inline-flex min-h-11 items-center text-accent underline">{e.title}</Link>
      </h3>
      <p className="flex flex-wrap items-center gap-2">
        <StatusBadge status={m.status} />
        {m.mine && <StatusBadge status={m.mine.key} />}
        {m.mine?.key === "waitlisted" && <span className="text-label">{m.mine.text}</span>}
      </p>
      <p className="text-body">{when}</p>
      <p className="text-body">{where}</p>
      {e.status !== "cancelled" && <p className="text-body font-semibold">{m.seatsText}</p>}
      {m.cta !== "none" && (
        <RegisterFlow eventId={e.id} title={e.title} when={when} where={where} mode={m.cta} primary={primary} />
      )}
    </li>
  );
}
