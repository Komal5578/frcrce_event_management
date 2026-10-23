// Pure clash check for a pending event (X5: UI prevents first, server recomputes, DB triggers are final).
export type ClashInput = {
  venueName: string; venueFree: boolean; capacity: number; seats: number;
  resources: { name: string; asked: number; free: number }[];
};
export type ClashResult = { ok: boolean; failures: string[]; message: string };

export function clashCheck(i: ClashInput): ClashResult {
  const failures: string[] = [];
  if (!i.venueFree) failures.push(`${i.venueName} is not available for this time.`);
  if (i.seats > i.capacity) failures.push(`Seats ${i.seats} exceed capacity ${i.capacity}.`);
  for (const r of i.resources)
    if (r.asked > r.free) failures.push(`Not enough ${r.name} are free for this time: ${Math.max(r.free, 0)} free, ${r.asked} requested.`);
  const ok = failures.length === 0;
  return { ok, failures, message: ok ? `No clash. ${i.venueName} is free for this time and seats ${i.seats} fit its capacity ${i.capacity}.` : failures.join(" ") };
}
