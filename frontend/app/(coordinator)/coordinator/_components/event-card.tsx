import Link from "next/link";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { isLowReg } from "@/lib/rules";
import type { components } from "@/lib/api-types";

type EventViewItem = components["schemas"]["EventViewItem"];

const CTA = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-ui bg-surface px-4 py-2 text-label font-semibold text-ink hover:bg-panel";

/** One event on My Events: status, when/where, seat meter, overdue and low-registration badges (CO-01). */
export function EventCard({ ev, overdue, now }: { ev: EventViewItem; overdue: number; now: Date }) {
  const editable = ev.status === "draft" || ev.status === "returned";
  const cap = ev.capacity ?? 0;
  return (
    <Card className="flex min-h-24 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-heading font-semibold">
          <Link href={editable ? `/coordinator/${ev.id}/edit` : `/coordinator/${ev.id}`} className="underline hover:text-accent">{ev.title}</Link>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ev.status as StatusKey} />
          {overdue > 0 && <StatusBadge status="overdue" />}
          {isLowReg(ev, now) && <StatusBadge status="lowreg" />}
        </div>
        <p className="text-body">
          {ev.starts_at ? formatDateTime(ev.starts_at) : "Date not set"} · {ev.venue_name ?? "Venue not chosen"}
        </p>
        {cap > 0 && (
          <div className="flex flex-col gap-1">
            <progress max={cap} value={Math.min(ev.confirmed, cap)} aria-label={`${ev.confirmed} of ${cap} seats taken`} className="h-2 w-full max-w-72 accent-accent" />
            <p className="text-label text-muted">{ev.confirmed} of {cap} seats</p>
          </div>
        )}
        {overdue > 0 && <p className="text-label font-semibold">{overdue} overdue {overdue === 1 ? "task" : "tasks"}</p>}
      </div>
      <Link href={editable ? `/coordinator/${ev.id}/edit` : `/coordinator/${ev.id}`} className={`${CTA} shrink-0`}>
        {editable ? "Continue" : "View"}<span className="sr-only">: {ev.title}</span>
      </Link>
    </Card>
  );
}
