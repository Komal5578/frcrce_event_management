import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { formatDate, formatTime, localToIso } from "@/lib/format";
import type { components } from "@/lib/api-types";
import { agendaGroups } from "../_lib/lanes";

type BookingItem = components["schemas"]["BookingItem"];

export function Agenda({ bookings }: { bookings: BookingItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      {agendaGroups(bookings).map((g) => (
        <section key={g.day} className="flex flex-col gap-2">
          <h3 className="text-heading font-semibold">{formatDate(localToIso(g.day, "12:00") ?? g.day)}</h3>
          <ul className="flex flex-col gap-3">
            {g.items.map((b) => (
              <li key={b.event_id} className="flex flex-col gap-1 rounded-control border border-border-card p-3 text-body">
                <span className="tabular-nums">{formatTime(b.starts_at)} to {formatTime(b.ends_at)}, {b.venue_name}</span>
                <span className="font-semibold">{b.title}</span>
                <span><StatusBadge status={b.status as StatusKey} /></span>
                {b.conflict && (<><span><StatusBadge status="clash" /></span><span>{b.conflict}</span></>)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
