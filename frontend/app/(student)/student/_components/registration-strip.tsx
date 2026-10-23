import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, relativeDay } from "@/lib/format";
import type { MyRegistration } from "@/lib/domain/people";
import { CancelFlow } from "./cancel-flow";

/** "Am I registered?" answered in text and badges. `upcoming` is already filtered and sorted. */
export function RegistrationStrip({ upcoming, now }: { upcoming: MyRegistration[]; now: Date }) {
  const items = upcoming.slice(0, 3);
  return (
    <section aria-labelledby="strip-h" className="rounded-control border border-border-card bg-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="strip-h" className="text-heading font-semibold">Your next events</h2>
        <Link href="/student/mine" className="inline-flex min-h-11 items-center text-label font-semibold text-accent underline">See all my events</Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-body">You are not registered for anything yet. Pick an event below.</p>
      ) : (
        <ul className="mt-2 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
          {items.map((r) => {
            const day = r.starts_at ? relativeDay(r.starts_at, now) : null;
            const waitlisted = r.reg_status === "waitlisted";
            return (
              <li key={r.event_id} className="flex flex-col gap-2 rounded-control border border-border-card bg-surface p-4">
                <Link href={`/student/events/${r.event_id}`} className="inline-flex min-h-11 items-center text-body font-semibold text-accent underline">{r.title}</Link>
                <p className="text-label">{day && <strong>{day}: </strong>}{r.starts_at ? formatDateTime(r.starts_at) : "Date to be confirmed"}</p>
                <p className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={waitlisted ? "waitlisted" : "registered"} />
                  {waitlisted && r.waitlist_pos && <span className="text-label">Waitlisted, number {r.waitlist_pos}</span>}
                </p>
                <CancelFlow eventId={r.event_id} title={r.title} when={r.starts_at ? formatDateTime(r.starts_at) : ""} waitlisted={waitlisted} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
