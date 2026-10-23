import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { StatusBadge, type StatusKey } from "./status-badge";

export type EventCardProps = {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  capacity: number;
  registrationCount: number;
  status: StatusKey;
  /** Controls which role-specific actions to render. */
  roleVariant: "coordinator" | "student";
};

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
  const startStr = start.toLocaleString(undefined, opts);
  const endStr =
    start.toDateString() === end.toDateString()
      ? end.toLocaleTimeString(undefined, { timeStyle: "short" })
      : end.toLocaleString(undefined, opts);
  return `${startStr} – ${endStr}`;
}

/** Consolidated event card for Coordinator and Student views. */
export function EventCard({
  id,
  title,
  description,
  startsAt,
  endsAt,
  venueName,
  capacity,
  registrationCount,
  status,
  roleVariant,
}: EventCardProps) {
  const seatsLeft = Math.max(0, capacity - registrationCount);
  const utilizationPct = capacity > 0 ? Math.round((registrationCount / capacity) * 100) : 0;
  const isFull = seatsLeft === 0;

  const coordinatorHref = `/coordinator/events/${id}`;
  const studentHref = `/student/events/${id}`;

  return (
    <article
      aria-label={title}
      className="flex flex-col gap-4 rounded-card border border-border-card bg-surface p-5 shadow-sm transition-shadow duration-150 hover:shadow-md"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-subheading font-semibold text-ink">
            {roleVariant === "coordinator" ? (
              <Link href={coordinatorHref} className="hover:text-accent transition-colors">
                {title}
              </Link>
            ) : (
              <Link href={studentHref} className="hover:text-accent transition-colors">
                {title}
              </Link>
            )}
          </h2>
          {description && (
            <p className="line-clamp-2 text-label text-muted">{description}</p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Event meta */}
      <dl className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-label text-muted">
          <Calendar size={14} aria-hidden="true" className="shrink-0" />
          <dt className="sr-only">Date and time</dt>
          <dd className="tabular-nums">{formatDateRange(startsAt, endsAt)}</dd>
        </div>
        <div className="flex items-center gap-2 text-label text-muted">
          <MapPin size={14} aria-hidden="true" className="shrink-0" />
          <dt className="sr-only">Venue</dt>
          <dd>{venueName}</dd>
        </div>
        <div className="flex items-center gap-2 text-label text-muted">
          <Users size={14} aria-hidden="true" className="shrink-0" />
          <dt className="sr-only">Seats remaining</dt>
          <dd className="tabular-nums">
            {isFull ? (
              <span className="font-semibold text-destructive">Full</span>
            ) : (
              <>
                <span className="font-semibold text-ink">{seatsLeft}</span> of{" "}
                {capacity} seats left
              </>
            )}
          </dd>
        </div>
      </dl>

      {/* Capacity bar */}
      <div className="flex flex-col gap-1">
        <progress
          value={registrationCount}
          max={capacity}
          aria-label={`${utilizationPct}% capacity used`}
          className="h-2 w-full overflow-hidden rounded-pill [&::-webkit-progress-bar]:bg-panel [&::-webkit-progress-value]:rounded-pill [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:rounded-pill [&::-moz-progress-bar]:bg-accent"
        />
        <p className="text-fine tabular-nums text-muted">
          {registrationCount}/{capacity} ({utilizationPct}%)
        </p>
      </div>

      {/* Role-specific CTA actions */}
      <div className="flex flex-wrap gap-2" data-no-print>
        {roleVariant === "coordinator" ? (
          <>
            <Link
              href={coordinatorHref}
              className="inline-flex min-h-11 items-center rounded-control border border-border-ui bg-surface px-4 text-label font-semibold text-ink transition-colors hover:bg-panel"
            >
              Manage
            </Link>
            <Link
              href={`${coordinatorHref}/monitor`}
              className="inline-flex min-h-11 items-center rounded-control border border-border-ui bg-surface px-4 text-label font-semibold text-ink transition-colors hover:bg-panel"
            >
              Monitor
            </Link>
          </>
        ) : (
          <>
            <Link
              href={studentHref}
              className="inline-flex min-h-11 items-center rounded-control border border-border-ui bg-surface px-4 text-label font-semibold text-ink transition-colors hover:bg-panel"
            >
              View details
            </Link>
            {!isFull && status === "open" && (
              <Link
                href={`${studentHref}/register`}
                className="inline-flex min-h-11 items-center rounded-control border border-accent bg-accent px-4 text-label font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
              >
                Register
              </Link>
            )}
          </>
        )}
      </div>
    </article>
  );
}
