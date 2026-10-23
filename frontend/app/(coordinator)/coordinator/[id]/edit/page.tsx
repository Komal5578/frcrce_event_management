import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { formatRange, isoToInputs } from "@/lib/format";
import { submitAction } from "../../actions";
import { readiness } from "../../_lib/readiness";
import { venueGroups, venueState } from "../../_lib/venues";
import { ConfirmFlow } from "../../_components/confirm-flow";
import { DetailsStep } from "../../_components/details-step";
import { LiveSummary } from "../../_components/live-summary";
import { ResourcesStep } from "../../_components/resources-step";
import { StepNav, StepRail, STEPS, type StepState } from "../../_components/step-rail";
import { TaskTable } from "../../_components/task-table";
import { TasksStep } from "../../_components/tasks-step";
import { VenueStep } from "../../_components/venue-step";

export const metadata: Metadata = { title: "Build event - College Events" };

type EventViewItem = components["schemas"]["EventViewItem"];
type VenueItem = components["schemas"]["VenueItem"];
type BusyVenueItem = components["schemas"]["BusyVenueItem"];
type ResourceItem = components["schemas"]["ResourceItem"];
type AllocationItem = components["schemas"]["AllocationItem"];
type TaskItem = components["schemas"]["TaskItem"];
type StudentProfileItem = components["schemas"]["StudentProfileItem"];
type MyProfileItem = components["schemas"]["MyProfileItem"];
type ResourceAvailableItem = components["schemas"]["ResourceAvailableItem"];

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  await requireRole("coordinator");
  const { id } = await params;
  const n = Number((await searchParams).step);
  const step = Number.isInteger(n) && n >= 1 && n <= 4 ? n : 1;

  let ev: EventViewItem;
  try {
    ev = await apiClient<EventViewItem>(`/api/events/${id}`);
  } catch (e) {
    return <Alert variant="error" title="We could not open this event">{e instanceof DomainError ? e.message : "Something went wrong on our side. Please try again in a moment."}</Alert>;
  }
  // not a draft any more: the monitor is the right place (redirect outside try/catch)
  if (ev.status !== "draft" && ev.status !== "returned") redirect(ev.status === "pending" ? `/coordinator/${id}?done=submitted` : `/coordinator/${id}`);

  const now = new Date();
  const slotSet = !!(ev.starts_at && ev.ends_at);
  const [venues, resources, allocations, tasks, students, profile, free, busy] = await Promise.all([
    apiClient<VenueItem[]>("/api/venues"),
    apiClient<ResourceItem[]>("/api/resources"),
    apiClient<AllocationItem[]>(`/api/events/${id}/allocations`),
    apiClient<TaskItem[]>(`/api/events/${id}/tasks`),
    apiClient<StudentProfileItem[]>("/api/people/students"),
    apiClient<MyProfileItem>("/api/people/me"),
    slotSet
      ? apiClient<VenueItem[]>(
          `/api/venues/free?start=${encodeURIComponent(ev.starts_at!)}&end=${encodeURIComponent(ev.ends_at!)}&exclude_event_id=${id}`
        )
      : Promise.resolve(null),
    slotSet
      ? apiClient<BusyVenueItem[]>(
          `/api/venues/busy?start=${encodeURIComponent(ev.starts_at!)}&end=${encodeURIComponent(ev.ends_at!)}&exclude_event_id=${id}`
        )
      : Promise.resolve([]),
  ]);

  const freeIds = free ? new Set(free.map((v) => v.id)) : null;
  const groups = venueGroups(venues, freeIds ?? new Set(), busy, ev.capacity ?? null);
  const venue = venueState(ev.venue_id ?? null, venues, freeIds, busy, ev.capacity ?? null);
  const ready = readiness(ev, ev.venue_capacity ?? null, allocations, tasks);

  const left = new Map(
    slotSet
      ? await Promise.all(
          resources
            .filter((r) => r.active)
            .map(async (r) => {
              const res = await apiClient<ResourceAvailableItem>(
                `/api/resources/${r.id}/available?start=${encodeURIComponent(ev.starts_at!)}&end=${encodeURIComponent(ev.ends_at!)}&exclude_event_id=${id}`
              );
              return [r.id, res.available] as const;
            })
        )
      : []
  );
  const held = new Map(allocations.map((a) => [a.resource_id, a.quantity]));

  const states: StepState[] = [
    ev.title && ev.capacity ? "done" : "todo",
    ev.venue_id && !venue.ok && slotSet ? "attention" : ev.venue_id && slotSet ? "done" : "todo",
    allocations.length ? "done" : "todo",
    tasks.length ? "done" : "todo",
  ];
  const inputs = ev.starts_at && ev.ends_at ? { d: isoToInputs(ev.starts_at), e: isoToInputs(ev.ends_at) } : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">{ev.title || "New event"}</h1>
      {ev.status === "returned" && (
        <Alert variant="warning" title="The Admin sent this back">{ev.return_reason ?? "No reason was given."}</Alert>
      )}
      <StepRail eventId={id} current={step} states={states} />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          <h2 className="text-heading font-semibold">Step {step} of 4: {STEPS[step - 1]}</h2>
          {step === 1 && <DetailsStep eventId={id} title={ev.title} seats={ev.capacity ?? null} description={ev.description ?? null} department={profile.department ?? null} />}
          {step === 2 && (
            <VenueStep eventId={id} date={inputs?.d.date ?? ""} start={inputs?.d.time ?? ""} end={inputs?.e.time ?? ""} venueId={ev.venue_id ?? null}
              free={groups.free} unavailable={groups.unavailable} />
          )}
          {step === 3 && (
            <>
              <ResourcesStep eventId={id} rows={resources.filter((r) => r.active).map((r) => ({ id: r.id, name: r.name, total: r.quantity, left: slotSet ? left.get(r.id) ?? 0 : null, qty: held.get(r.id) ?? 0 }))} />
              <StepNav eventId={id} step={3} />
            </>
          )}
          {step === 4 && (
            <>
              <TasksStep eventId={id} students={students.map((s) => ({ id: s.id, name: s.name }))}>
                <TaskTable tasks={tasks} now={now} />
              </TasksStep>
              <div className="flex flex-col gap-3">
                {!ready.ready && (
                  <p className="text-body">{ready.reason}{" "}
                    {ready.missing.map((m, i) => <span key={m.key}>{i > 0 && ", "}<Link href={`/coordinator/${id}/edit?step=${m.step}`} className="underline">{m.label}</Link></span>)}
                  </p>
                )}
                <StepNav eventId={id} step={4} primary={
                  <ConfirmFlow
                    triggerLabel="Review and submit"
                    verb="submit"
                    disabledReason={ready.ready ? null : ready.reason}
                    summary={
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
                        <dt className="font-semibold">Event</dt><dd>{ev.title}</dd>
                        <dt className="font-semibold">Date and time</dt><dd>{ev.starts_at && ev.ends_at ? formatRange(ev.starts_at, ev.ends_at) : "Not set"}</dd>
                        <dt className="font-semibold">Venue</dt><dd>{ev.venue_name ?? "Not chosen"}</dd>
                        <dt className="font-semibold">Seats</dt><dd>{ev.capacity ?? "Not set"}</dd>
                        <dt className="font-semibold">Resources</dt><dd>{allocations.length ? allocations.map((a) => `${a.name} x${a.quantity}`).join(", ") : "None"}</dd>
                        <dt className="font-semibold">Tasks</dt><dd>{tasks.length}</dd>
                      </dl>
                    }
                    consequence="The Admin is asked to approve this event. You can still edit it until they decide."
                    action={submitAction.bind(null, id)}
                    successTitle="Sent for approval"
                    successBody="We will tell you here when the Admin decides. Status is now Pending approval."
                    successStatus="pending"
                  />
                } />
              </div>
            </>
          )}
        </div>
        <div className="order-1 lg:sticky lg:top-20 lg:order-2">
          <LiveSummary ev={ev} venue={venue} allocations={allocations} tasks={tasks} ready={ready} now={now} />
        </div>
      </div>
    </div>
  );
}
