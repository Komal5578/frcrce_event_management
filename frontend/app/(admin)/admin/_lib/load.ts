// Loads the clash-check inputs through apiClient (or lib/domain in vitest), shared by approvals and approveAction.
import type { Actor } from "@/lib/domain/actor";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { clashCheck, type ClashResult } from "./clash";

type EventViewItem = components["schemas"]["EventViewItem"];
type VenueItem = components["schemas"]["VenueItem"];
type BusyVenueItem = components["schemas"]["BusyVenueItem"];
type AllocationItem = components["schemas"]["AllocationItem"];
type ResourceAvailableItem = components["schemas"]["ResourceAvailableItem"];

export async function loadClash(
  actor: Actor,
  eventId: string,
): Promise<{
  event: EventViewItem;
  check: ClashResult;
  resources: { name: string; asked: number; free: number }[];
}> {
  if (process.env.VITEST) {
    const { getEventDetail } = await import("@/lib/domain/views");
    const { freeVenues, resourceAvailable } = await import("@/lib/domain/venues");
    const { listAllocations } = await import("@/lib/domain/allocations");

    const event = (await getEventDetail(actor, eventId)) as unknown as EventViewItem;
    if (!event.venue_id || !event.starts_at || !event.ends_at) {
      return {
        event,
        check: { ok: false, failures: ["This event has no venue or time yet."], message: "This event has no venue or time yet." },
        resources: [],
      };
    }
    const free = await freeVenues(actor, event.starts_at, event.ends_at, event.id);
    const allocs = await listAllocations(actor, event.id);
    const resources = await Promise.all(
      allocs.map(async (a) => ({
        name: a.name,
        asked: a.quantity,
        free: await resourceAvailable(actor, a.resource_id, event.starts_at!, event.ends_at!, event.id),
      })),
    );
    const check = clashCheck({
      venueName: event.venue_name ?? "The venue",
      venueFree: free.some((v) => v.id === event.venue_id),
      capacity: event.venue_capacity ?? 0,
      seats: event.capacity ?? 0,
      resources,
    });
    return { event, check, resources };
  }

  const event = await apiClient<EventViewItem>(`/api/events/${eventId}`);
  if (!event.venue_id || !event.starts_at || !event.ends_at) {
    return {
      event,
      check: { ok: false, failures: ["This event has no venue or time yet."], message: "This event has no venue or time yet." },
      resources: [],
    };
  }

  const [free, busy, allocs] = await Promise.all([
    apiClient<VenueItem[]>(
      `/api/venues/free?start=${encodeURIComponent(event.starts_at)}&end=${encodeURIComponent(event.ends_at)}&exclude_event_id=${event.id}`,
    ),
    apiClient<BusyVenueItem[]>(
      `/api/venues/busy?start=${encodeURIComponent(event.starts_at)}&end=${encodeURIComponent(event.ends_at)}&exclude_event_id=${event.id}`,
    ).catch(() => [] as BusyVenueItem[]),
    apiClient<AllocationItem[]>(`/api/events/${event.id}/allocations`),
  ]);

  const resources = await Promise.all(
    allocs.map(async (a) => {
      const avail = await apiClient<ResourceAvailableItem>(
        `/api/resources/${a.resource_id}/available?start=${encodeURIComponent(event.starts_at!)}&end=${encodeURIComponent(event.ends_at!)}&exclude_event_id=${event.id}`,
      );
      return {
        name: a.name,
        asked: a.quantity,
        free: avail.available,
      };
    }),
  );

  const venueFree = free.some((v) => v.id === event.venue_id);
  const conflicting = !venueFree ? busy.find((b) => b.venue_id === event.venue_id) : null;
  const venueName = event.venue_name ?? "The venue";

  const check = clashCheck({
    venueName: conflicting ? `${venueName} (booked by "${conflicting.event_title}")` : venueName,
    venueFree,
    capacity: event.venue_capacity ?? 0,
    seats: event.capacity ?? 0,
    resources,
  });

  return { event, check, resources };
}
