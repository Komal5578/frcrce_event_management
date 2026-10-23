// Catalog form parsing: human field errors; the domain re-validates (T-04-33).
type Raw = { id?: string; name?: unknown; capacity?: unknown; total?: unknown; location?: unknown; active?: unknown };
export type Parsed<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

const whole = (v: unknown) => { const s = String(v ?? "").trim(); return /^\d+$/.test(s) ? Number(s) : NaN; };
const name = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function parseVenue(f: Raw): Parsed<{ id?: string; name: string; capacity: number; location: string | null; active: boolean }> {
  const fieldErrors: Record<string, string> = {};
  const n = name(f.name), cap = whole(f.capacity);
  if (!n || n.length > 80) fieldErrors.name = "Enter a name for the venue.";
  if (!(cap >= 1)) fieldErrors.capacity = "Enter the capacity as a whole number, at least 1.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, value: { id: f.id || undefined, name: n, capacity: cap, location: name(f.location) || null, active: !!f.active } };
}

export function parseResource(f: Raw): Parsed<{ id?: string; name: string; quantity: number; active: boolean }> {
  const fieldErrors: Record<string, string> = {};
  const n = name(f.name), q = whole(f.total);
  if (!n || n.length > 80) fieldErrors.name = "Enter a name for the resource.";
  if (!(q >= 1)) fieldErrors.total = "Enter the total as a whole number, at least 1.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, value: { id: f.id || undefined, name: n, quantity: q, active: !!f.active } };
}
