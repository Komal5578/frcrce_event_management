import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { formatDate, formatTime, localToIso } from "@/lib/format";
import type { BookingRow } from "@/lib/domain/admin";
import { lanes } from "../_lib/lanes";

const dayLabel = (key: string) => formatDate(localToIso(key, "12:00") ?? key);

/** Week lanes: venues down, 7 days across. A clash badge shows only where the domain set `conflict`. */
export function VenueLanes({ venues, bookings, days }: { venues: { id: string; name: string }[]; bookings: BookingRow[]; days: string[] }) {
  const by = lanes(bookings);
  return (
    <div role="region" aria-label="Venue lanes, scrolls sideways on narrow screens" tabIndex={0} className="overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse text-left">
        <caption className="pb-2 text-left text-heading font-semibold">Bookings by venue, week of {dayLabel(days[0])}</caption>
        <thead>
          <tr>
            <th scope="col" className="border border-border-card p-2 text-label">Venue</th>
            {days.map((d) => <th key={d} scope="col" className="min-w-28 border border-border-card p-2 text-label">{dayLabel(d)}</th>)}
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id}>
              <th scope="row" className="border border-border-card p-2 align-top text-body">{v.name}</th>
              {days.map((d) => (
                <td key={d} className="border border-border-card p-2 align-top">
                  <ul className="flex flex-col gap-2">
                    {(by.get(v.id)?.get(d) ?? []).map((b) => (
                      <li key={b.event_id} className="flex flex-col gap-1 text-label">
                        <span className="tabular-nums">{formatTime(b.starts_at)} to {formatTime(b.ends_at)}</span>
                        <span className="font-semibold">{b.title}</span>
                        <span><StatusBadge status={b.status as StatusKey} /></span>
                        {b.conflict && (<><span><StatusBadge status="clash" /></span><span>{b.conflict}</span></>)}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
