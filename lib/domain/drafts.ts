import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";

export type TemplateRow = {
  id: string; name: string; type: string | null; description: string | null;
  default_duration_minutes: number | null; default_capacity: number | null; department: string | null;
};
/** Only these seven fields can ever be written; status, owner and reasons are not patchable. null clears. */
export type DraftPatch = {
  title?: string; type?: string | null; description?: string | null; capacity?: number | null;
  venueId?: string | null; startsAt?: string | null; endsAt?: string | null;
};
type Cur = {
  title: string; type: string | null; description: string | null; capacity: number | null;
  venue_id: string | null; starts_at: string | null; ends_at: string | null; status: string; confirmed: number;
};

const bad = (m: string) => new DomainError("INVALID_INPUT", m);
const NOT_YOURS = "Only the event coordinator can do that.";

/** Exactly YYYY-MM-DDTHH:MM:SS.mmmZ and a real date (matches the schema GLOB). */
export function validIso(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) return false;
  try { return new Date(v).toISOString() === v; } catch { return false; }
}

export async function listTemplates(actor: Actor): Promise<TemplateRow[]> {
  requireActorRole(actor, "coordinator", "admin");
  return guard(async () => (await getDb().prepare(
    "SELECT id, name, type, description, default_duration_minutes, default_capacity, department FROM event_templates ORDER BY name")
    .all<TemplateRow>()).results);
}

/** C1: new draft prefilled from the template and the coordinator's own department. */
export async function createDraft(actor: Actor, templateId: string | null): Promise<string> {
  requireActorRole(actor, "coordinator");
  const db = getDb();
  const t = templateId ? await guard(() => db.prepare("SELECT * FROM event_templates WHERE id = ?1").bind(templateId).first<TemplateRow>()) : null;
  if (templateId && !t) throw bad("That template no longer exists. Pick another or start from scratch.");
  const me = await guard(() => db.prepare("SELECT department FROM profiles WHERE id = ?1").bind(actor.id).first<{ department: string | null }>());
  const dept = me?.department ?? t?.department ?? null;
  const title = t ? (dept ? `${t.name} - ${dept}` : t.name) : "Untitled event";
  const id = crypto.randomUUID();
  await guard(() => db.prepare(
    "INSERT INTO events (id, title, type, description, capacity, department, template_id, coordinator_id, status) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'draft')")
    .bind(id, title, t?.type ?? null, t?.description ?? null, t?.default_capacity ?? null, dept, t?.id ?? null, actor.id).run());
  return id;
}

/** Owner's row (with confirmed count) or NOT_ALLOWED; BAD_STATE when its status is not in `allowed`. */
async function ownedEvent(actor: Actor, eventId: string, allowed: string[], what: string): Promise<Cur> {
  requireActorRole(actor, "coordinator");
  const cur = await guard(() => getDb().prepare(
    "SELECT e.title, e.type, e.description, e.capacity, e.venue_id, e.starts_at, e.ends_at, e.status, " +
    "(SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed " +
    "FROM events e WHERE e.id = ?1 AND e.coordinator_id = ?2").bind(eventId, actor.id).first<Cur>());
  if (!cur) throw new DomainError("NOT_ALLOWED", NOT_YOURS);
  if (!allowed.includes(cur.status)) throw new DomainError("BAD_STATE", `This event is ${cur.status}; ${what}`);
  return cur;
}

/** Merge the whitelisted patch over the current row and validate the result. */
async function merge(cur: Cur, p: DraftPatch) {
  const has = (k: keyof DraftPatch) => k in p;
  const m = {
    title: has("title") ? p.title : cur.title,
    type: has("type") ? p.type ?? null : cur.type,
    description: has("description") ? p.description ?? null : cur.description,
    capacity: has("capacity") ? p.capacity ?? null : cur.capacity,
    venue_id: has("venueId") ? p.venueId ?? null : cur.venue_id,
    starts_at: has("startsAt") ? p.startsAt ?? null : cur.starts_at,
    ends_at: has("endsAt") ? p.endsAt ?? null : cur.ends_at,
  };
  const title = typeof m.title === "string" ? m.title.trim() : "";
  if (!title) throw bad("Give the event a title.");
  if (title.length > 120) throw bad("Keep the title to 120 characters or fewer.");
  m.title = title;
  if (m.capacity !== null && (!Number.isInteger(m.capacity) || m.capacity < 1)) throw bad("Capacity must be a whole number, 1 or more.");
  if (m.starts_at !== null && !validIso(m.starts_at)) throw bad("The start time is not a valid date and time.");
  if (m.ends_at !== null && !validIso(m.ends_at)) throw bad("The end time is not a valid date and time.");
  if (m.starts_at && m.ends_at && m.ends_at <= m.starts_at) throw bad("The event must end after it starts.");
  if (m.venue_id !== null && m.venue_id !== cur.venue_id) {
    const v = await guard(() => getDb().prepare("SELECT 1 AS ok FROM venues WHERE id = ?1 AND active = 1").bind(m.venue_id).first());
    if (!v) throw bad("That venue is not available. Pick another venue.");
  }
  return m as typeof m & { title: string };
}

const SET = "SET title = ?3, type = ?4, description = ?5, capacity = ?6, venue_id = ?7, starts_at = ?8, ends_at = ?9";
const same = (c: Cur, m: Awaited<ReturnType<typeof merge>>) =>
  c.title === m.title && c.type === m.type && c.description === m.description && c.capacity === m.capacity &&
  c.venue_id === m.venue_id && c.starts_at === m.starts_at && c.ends_at === m.ends_at;

/** C1: autosave a partial patch on a draft or returned event. */
export async function saveDraft(actor: Actor, eventId: string, patch: DraftPatch): Promise<void> {
  const cur = await ownedEvent(actor, eventId, ["draft", "returned"], "only drafts and returned events can be edited here.");
  const m = await merge(cur, patch);
  const r = await guard(() => getDb().prepare(
    "UPDATE events " + SET + " WHERE id = ?1 AND coordinator_id = ?2 AND status IN ('draft','returned')")
    .bind(eventId, actor.id, m.title, m.type, m.description, m.capacity, m.venue_id, m.starts_at, m.ends_at).run());
  if (r.meta.changes === 0) throw new DomainError("BAD_STATE", "This event changed while you were editing. Refresh the page to see where it stands.");
}

/** C7 [ASSUMED COORD-07]: edit a live event; no re-approval, registrants are told in the same batch. */
export async function updateEvent(actor: Actor, eventId: string, patch: DraftPatch): Promise<{ notified: number }> {
  const cur = await ownedEvent(actor, eventId, ["pending", "approved", "open"], "only pending, approved or open events can be changed this way.");
  const m = await merge(cur, patch);
  if (m.capacity !== null && m.capacity < cur.confirmed)
    throw bad(`${cur.confirmed} people are already confirmed. Choose ${cur.confirmed} or more.`);
  if (same(cur, m)) return { notified: 0 };
  const db = getDb();
  const body = `The details of "${m.title}" were updated. Open the event to see the new time and venue.`;
  // ponytail: read-then-batch; the UPDATE is state-guarded, a race only costs a spurious notice.
  const out = await guard(() => db.batch([
    db.prepare("UPDATE events " + SET + " WHERE id = ?1 AND coordinator_id = ?2 AND status IN ('pending','approved','open')")
      .bind(eventId, actor.id, m.title, m.type, m.description, m.capacity, m.venue_id, m.starts_at, m.ends_at),
    db.prepare(
      "INSERT INTO notifications (id, user_id, event_id, kind, body) " +
      "SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'event_changed', ?2 FROM registrations r " +
      "WHERE r.event_id = ?1 AND r.status IN ('confirmed','waitlisted')").bind(eventId, body),
  ]));
  return { notified: out[1].meta.changes };
}

const NEXT: Record<string, "open" | "ongoing" | "completed"> = { approved: "open", open: "ongoing", ongoing: "completed" };

/** C5: owner moves approved -> open -> ongoing -> completed. */
export async function advanceEvent(actor: Actor, eventId: string): Promise<"open" | "ongoing" | "completed"> {
  const cur = await ownedEvent(actor, eventId, Object.keys(NEXT), "only approved, open or ongoing events can move on.");
  const next = NEXT[cur.status];
  const r = await guard(() => getDb().prepare(
    "UPDATE events SET status = ?3 WHERE id = ?1 AND coordinator_id = ?2 AND status = ?4")
    .bind(eventId, actor.id, next, cur.status).run());
  if (r.meta.changes === 0) throw new DomainError("BAD_STATE", "This event changed while you were working. Refresh the page to see where it stands.");
  return next;
}
