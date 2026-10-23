import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { isoToInputs } from "@/lib/format";
import { venueGroups } from "../../_lib/venues";
import { ChangeForm } from "../../_components/change-form";

export const metadata: Metadata = { title: "Edit event - College Events" };

type EventViewItem = components["schemas"]["EventViewItem"];
type VenueItem = components["schemas"]["VenueItem"];
type BusyVenueItem = components["schemas"]["BusyVenueItem"];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("coordinator");
  const { id } = await params;
  let ev: EventViewItem;
  try {
    ev = await apiClient<EventViewItem>(`/api/events/${id}`);
  } catch (e) {
    return <Alert variant="error" title="We could not open this event">{e instanceof DomainError ? e.message : "Something went wrong on our side. Please try again in a moment."}</Alert>;
  }
  if (ev.status === "draft" || ev.status === "returned") redirect(`/coordinator/${id}/edit?step=1`);
  if (ev.status === "completed" || ev.status === "cancelled" || ev.status === "ongoing" || !ev.starts_at || !ev.ends_at) redirect(`/coordinator/${id}`);

  const [venues, free, busy] = await Promise.all([
    apiClient<VenueItem[]>("/api/venues"),
    apiClient<VenueItem[]>(
      `/api/venues/free?start=${encodeURIComponent(ev.starts_at)}&end=${encodeURIComponent(ev.ends_at)}&exclude_event_id=${id}`
    ),
    apiClient<BusyVenueItem[]>(
      `/api/venues/busy?start=${encodeURIComponent(ev.starts_at)}&end=${encodeURIComponent(ev.ends_at)}&exclude_event_id=${id}`
    ),
  ]);
  const g = venueGroups(venues, new Set(free.map((v) => v.id)), busy, ev.capacity ?? null);
  const s = isoToInputs(ev.starts_at), e = isoToInputs(ev.ends_at);
  return (
    <div className="flex flex-col gap-6">
      <div><Link href={`/coordinator/${id}`} className="inline-flex min-h-11 items-center underline">Back to the event</Link></div>
      <h1 className="text-display font-semibold">Edit {ev.title}</h1>
      <ChangeForm
        eventId={id}
        initial={{ title: ev.title, seats: String(ev.capacity ?? ""), description: ev.description ?? "", date: s.date, start: s.time, end: e.time, venueId: ev.venue_id ?? "" }}
        venueNames={Object.fromEntries(venues.map((v) => [v.id, v.name]))}
        free={g.free}
        unavailable={g.unavailable}
      />
    </div>
  );
}
