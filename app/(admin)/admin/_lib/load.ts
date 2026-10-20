// Loads the clash-check inputs through lib/domain (no DB access here), shared by the approvals page and approveAction.
import type { Actor } from "@/lib/domain/actor";
import { getEventDetail, type EventView } from "@/lib/domain/views";
import { freeVenues, resourceAvailable } from "@/lib/domain/venues";
import { listAllocations } from "@/lib/domain/allocations";
import { clashCheck, type ClashResult } from "./clash";

export async function loadClash(actor: Actor, eventId: string): Promise<{ event: EventView; check: ClashResult; resources: { name: string; asked: number; free: number }[] }> {
  const event = await getEventDetail(actor, eventId);
  if (!event.venue_id || !event.starts_at || !event.ends_at)
    return { event, check: { ok: false, failures: ["This event has no venue or time yet."], message: "This event has no venue or time yet." }, resources: [] };
  const free = await freeVenues(actor, event.starts_at, event.ends_at, event.id);
  const allocs = await listAllocations(actor, event.id);
  const resources = await Promise.all(allocs.map(async (a) => ({
    name: a.name, asked: a.quantity, free: await resourceAvailable(actor, a.resource_id, event.starts_at!, event.ends_at!, event.id),
  })));
  const check = clashCheck({
    venueName: event.venue_name ?? "The venue", venueFree: free.some((v) => v.id === event.venue_id),
    capacity: event.venue_capacity ?? 0, seats: event.capacity ?? 0, resources,
  });
  return { event, check, resources };
}
