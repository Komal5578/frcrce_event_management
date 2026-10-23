// Pure: is the draft ready to submit, and what is missing (CO-02..06 Live Summary readiness line).
export type ReadyEvent = {
  title?: string | null; capacity?: number | null; venue_id?: string | null; starts_at?: string | null; ends_at?: string | null;
};
export type Missing = { key: "title" | "seats" | "venue" | "date"; label: string; step: 1 | 2 };

export const DISABLED_REASON = "Add a venue, date and seats before you submit.";

export function readiness(
  ev: ReadyEvent, venueCapacity: number | null, allocations: unknown[] = [], tasks: unknown[] = [],
) {
  const missing: Missing[] = [];
  if (!ev.title?.trim()) missing.push({ key: "title", label: "title", step: 1 });
  if (!ev.capacity) missing.push({ key: "seats", label: "seats", step: 1 });
  if (!ev.venue_id) missing.push({ key: "venue", label: "venue", step: 2 });
  else if (ev.capacity && venueCapacity !== null && venueCapacity < ev.capacity)
    missing.push({ key: "venue", label: "a venue that fits your seats", step: 2 });
  if (!ev.starts_at || !ev.ends_at) missing.push({ key: "date", label: "date", step: 2 });
  const ready = missing.length === 0;
  return {
    ready, missing, resources: allocations.length, tasks: tasks.length,
    line: ready ? "Ready to submit" : `Missing: ${missing.map((m) => m.label).join(", ")}`,
    reason: ready ? null : DISABLED_REASON,
  };
}
