import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { getEventDetail, type EventView } from "@/lib/domain/views";
import { listAllocations, listEventTasks } from "@/lib/domain/allocations";
import { formatRange, formatShortDate } from "@/lib/format";
import { advanceAction, cancelAction } from "../actions";
import { ago, monitorModel } from "../_lib/monitor";
import { ConfirmFlow } from "../_components/confirm-flow";
import { Flash } from "../_components/flash";
import { GlanceStrip } from "../_components/glance-strip";
import { TaskTable } from "../_components/task-table";

export const metadata: Metadata = { title: "Event - College Events" };

const ADVANCE: Record<string, { label: string; verb: string; consequence: string; title: string; body: string; badge: StatusKey }> = {
  approved: { label: "Open registration", verb: "open registration", consequence: "Students can now see and register for this event.", title: "Registration is open", body: "Status is now Open.", badge: "open" },
  open: { label: "Start event", verb: "start the event", consequence: "The event is marked as happening now.", title: "Event started", body: "Status is now Ongoing.", badge: "ongoing" },
  ongoing: { label: "Complete event", verb: "complete the event", consequence: "The event is marked completed and its venue and resources are released.", title: "Event completed", body: "Venue and resources are released.", badge: "completed" },
};
const SENTENCE = (ev: EventView, now: Date) => ({
  pending: `Sent ${ago(ev.updated_at, now)}. The Admin has not decided yet.`,
  approved: "The Admin approved this event. Open registration when you are ready.",
  open: "Registration is open. Students can register now.",
  ongoing: "The event is under way.",
  completed: "This event is finished.",
  cancelled: ev.cancel_reason ? `This event was cancelled. Reason: ${ev.cancel_reason}` : "This event was cancelled.",
} as Record<string, string>)[ev.status] ?? "";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }> }) {
  const p = await requireRole("coordinator");
  const actor = { id: p.id, role: p.role };
  const { id } = await params;
  const { done } = await searchParams;

  let ev: EventView;
  try { ev = await getEventDetail(actor, id); } catch (e) {
    return <Alert variant="error" title="We could not open this event">{e instanceof DomainError ? e.message : "Something went wrong on our side. Please try again in a moment."}</Alert>;
  }
  if (ev.status === "draft" || ev.status === "returned") redirect(`/coordinator/${id}/edit?step=1`);

  const now = new Date();
  const [tasks, allocations] = await Promise.all([listEventTasks(actor, id), listAllocations(actor, id)]);
  const m = monitorModel(ev, tasks, now);
  const terminal = ev.status === "completed" || ev.status === "cancelled";
  const adv = ADVANCE[ev.status];
  const told = ev.confirmed + ev.waitlisted;
  const when = ev.starts_at && ev.ends_at ? formatRange(ev.starts_at, ev.ends_at) : "Not set";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display font-semibold">{ev.title}</h1>
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={ev.status as StatusKey} /><p className="text-body">{SENTENCE(ev, now)}</p></div>
      </div>

      {done === "submitted" && ev.status === "pending" && (
        <Flash title="Sent for approval">We will tell you here when the Admin decides. Status is now Pending approval.</Flash>
      )}

      {(
        <div className="flex flex-wrap items-start gap-3">
          {/* stable keys: the outcome Alert survives the status change that swaps the button */}
          <ConfirmFlow
            key="advance"
            triggerLabel={adv?.label ?? ""}
            hideTrigger={!adv}
            verb={adv?.verb ?? ""}
            summary={<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body"><dt className="font-semibold">Event</dt><dd>{ev.title}</dd><dt className="font-semibold">Date and time</dt><dd>{when}</dd><dt className="font-semibold">Venue</dt><dd>{ev.venue_name ?? "Not chosen"}</dd></dl>}
            consequence={adv?.consequence ?? ""}
            action={advanceAction.bind(null, id)}
            successTitle={adv?.title ?? ""}
            successBody={adv?.body ?? ""}
            successStatus={adv?.badge}
          />
          {!terminal && <Link href={`/coordinator/${id}/change`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-ui bg-surface px-4 py-2 text-label font-semibold text-ink hover:bg-panel">Edit</Link>}
        </div>
      )}

      <GlanceStrip status={ev.status} m={m} />

      {terminal && ev.status === "completed" && (
        <p className="text-body">Registered {ev.confirmed} of {ev.capacity ?? 0}. Tasks done {m.tasksDone} of {m.tasksTotal}. Venue and resources released.</p>
      )}

      <Card className="flex flex-col gap-3"><h2 className="text-heading font-semibold">Tasks</h2><TaskTable tasks={tasks} now={now} /></Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Venue and resources</h2>
        <p className="text-body">{when}</p>
        <p className="text-body">{ev.venue_name ? `${ev.venue_name}, capacity ${ev.venue_capacity}` : "No venue chosen"}</p>
        <p className="text-body">{allocations.length ? allocations.map((a) => `${a.name} x${a.quantity}`).join(", ") : "No resources requested"}</p>
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Timeline</h2>
        <ul className="text-body"><li>Created {formatShortDate(ev.created_at)}</li><li>Last updated {formatShortDate(ev.updated_at)}</li></ul>
      </Card>

      {/* Cancel: always for non-terminal; stays mounted (trigger hidden) so its outcome is still read after the status changes */}
      <ConfirmFlow
        key="cancel"
        hideTrigger={terminal}
        triggerLabel="Cancel event"
        variant="destructive"
        verb="cancel this event"
        reasonLabel="Reason (optional)"
        summary={<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body"><dt className="font-semibold">Event</dt><dd>{ev.title}</dd><dt className="font-semibold">Date</dt><dd>{when}</dd><dt className="font-semibold">Venue</dt><dd>{ev.venue_name ?? "Not chosen"}</dd><dt className="font-semibold">Registered</dt><dd>{ev.confirmed}</dd></dl>}
        consequence={`The event is cancelled, the venue and resources are released, and ${told} registrants are told in the app. This cannot be undone.`}
        action={cancelAction.bind(null, id)}
        successTitle="Event cancelled"
        successBody="{n} registrants have been notified."
      />

      {terminal && <div><Link href="/coordinator" className="inline-flex min-h-11 items-center underline">Back to My Events</Link></div>}
    </div>
  );
}
