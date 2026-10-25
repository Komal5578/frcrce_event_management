// Domain layer: every function takes the Actor (from the session, never request input) first.
// Port of backend/app/domain/*.py onto D1. D1 has no interactive transactions, so races are closed
// by single-statement writes, db.batch() (atomic) and the guard triggers in migrations/0002_guards.sql.

import {
  Actor, DomainError, Role, Row, all, batch, bool, first, guarded, nowIso, requireRole, stmt, ts, uuid,
} from "./core";

type D = D1Database;
const HELD = "('approved', 'open', 'ongoing')";
const NO_ID = "00000000-0000-0000-0000-000000000000";

const NEXT = new Set(["draft>pending", "returned>pending", "pending>approved", "pending>returned", "approved>open", "open>ongoing", "ongoing>completed"]);
const CANCELLABLE = new Set(["draft", "pending", "returned", "approved", "open", "ongoing"]);
const assertTransition = (from: string, to: string) => {
  if (!(NEXT.has(`${from}>${to}`) || (to === "cancelled" && CANCELLABLE.has(from)))) throw new DomainError("BAD_STATE");
};

const VISIBLE: Record<Role, string> = {
  student: " WHERE (e.status IN ('open', 'ongoing', 'completed') OR EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?))",
  coordinator: " WHERE e.coordinator_id = ?",
  admin: " WHERE ? IS NOT NULL",
};

// ---- views -----------------------------------------------------------------------------------
const EVENTS_SQL = `
SELECT e.id, e.title, e.type, e.description, e.coordinator_id, e.venue_id,
       e.starts_at, e.ends_at, e.capacity, e.status, e.department,
       e.template_id, e.return_reason, e.cancel_reason, e.created_at, e.updated_at,
       v.name AS venue_name, v.location AS venue_location, v.capacity AS venue_capacity,
       c.name AS coordinator_name,
       (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed,
       (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') AS waitlisted,
       (SELECT m.status FROM registrations m WHERE m.event_id = e.id AND m.user_id = ?) AS my_reg,
       (SELECT CASE WHEN m.status = 'waitlisted' THEN 1 + (
                 SELECT COUNT(*) FROM registrations w
                 WHERE w.event_id = e.id AND w.status = 'waitlisted'
                   AND (w.created_at < m.created_at OR (w.created_at = m.created_at AND w.id < m.id)))
               ELSE NULL END
        FROM registrations m WHERE m.event_id = e.id AND m.user_id = ?) AS my_waitlist_pos
FROM events e
LEFT JOIN venues v ON v.id = e.venue_id
LEFT JOIN profiles c ON c.id = e.coordinator_id`;

export const listEventsWithSeats = (db: D, a: Actor) =>
  all(db, EVENTS_SQL + VISIBLE[a.role] + " ORDER BY e.starts_at IS NULL, e.starts_at, e.id", a.id, a.id, a.id);

export async function getEventDetail(db: D, a: Actor, id: string) {
  const row = await first(db, EVENTS_SQL + VISIBLE[a.role] + " AND e.id = ?", a.id, a.id, a.id, id);
  if (!row) throw new DomainError("NOT_ALLOWED", "You cannot see this event.");
  return row;
}

async function manageableEvent(db: D, a: Actor, id: string) {
  requireRole(a, "coordinator", "admin");
  const ev = await first(db,
    `SELECT id, status, title, coordinator_id, venue_id, starts_at, ends_at, capacity FROM events
     WHERE id = ? AND (coordinator_id = ? OR ? = 'admin')`, id, a.id, a.role);
  if (!ev) throw new DomainError("NOT_ALLOWED", "Only the event coordinator or an administrator can do that.");
  return ev;
}

async function ownedEvent(db: D, a: Actor, id: string) {
  const ev = await first(db, "SELECT * FROM events WHERE id = ?", id);
  if (!ev || ev.coordinator_id !== a.id) throw new DomainError("NOT_ALLOWED", "Only the event coordinator can do that.");
  return ev;
}

// ---- drafts and edits ------------------------------------------------------------------------
export function listTemplates(db: D, a: Actor) {
  requireRole(a, "coordinator", "admin");
  return all(db, "SELECT id, name, type, description, default_duration_minutes, default_capacity, department FROM event_templates ORDER BY name");
}

export async function createDraft(db: D, a: Actor, templateId: string | null) {
  requireRole(a, "coordinator");
  let t: Row | null = null;
  if (templateId) {
    t = await first(db, "SELECT id, name, type, description, default_capacity, department FROM event_templates WHERE id = ?", templateId);
    if (!t) throw new DomainError("INVALID_INPUT", "That template no longer exists. Pick another or start from scratch.");
  }
  const profile = await first(db, "SELECT department FROM profiles WHERE id = ?", a.id);
  const dept = profile?.department || t?.department || null;
  const title = t ? (dept ? `${t.name} - ${dept}` : t.name) : "Untitled event";
  const id = uuid();
  await guarded(async () => void (await stmt(db,
    `INSERT INTO events (id, title, type, description, capacity, department, template_id, coordinator_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    id, title, t?.type ?? null, t?.description ?? null, t?.default_capacity ?? null, dept, templateId, a.id).run()));
  return id;
}

async function mergePatch(db: D, cur: Row, patch: Row) {
  const pick = (k: string) => (k in patch ? patch[k] : cur[k]);
  const m = {
    title: pick("title"), type: pick("type"), description: pick("description"), capacity: pick("capacity"),
    venue_id: pick("venue_id"), starts_at: ts(pick("starts_at")), ends_at: ts(pick("ends_at")),
  };
  const title = m.title == null ? "" : String(m.title).trim();
  if (!title) throw new DomainError("INVALID_INPUT", "Give the event a title.");
  if (title.length > 120) throw new DomainError("INVALID_INPUT", "Keep the title to 120 characters or fewer.");
  m.title = title;
  if (m.capacity != null && (!Number.isInteger(m.capacity) || m.capacity < 1))
    throw new DomainError("INVALID_INPUT", "Capacity must be a whole number, 1 or more.");
  if (m.starts_at && m.ends_at && m.ends_at <= m.starts_at) throw new DomainError("INVALID_INPUT", "The event must end after it starts.");
  if (m.venue_id && m.venue_id !== cur.venue_id) {
    const v = await first(db, "SELECT active FROM venues WHERE id = ?", m.venue_id);
    if (!v || !v.active) throw new DomainError("INVALID_INPUT", "That venue is not available. Pick another venue.");
  }
  return m;
}

const UPDATE_EVENT = `UPDATE events SET title = ?, type = ?, description = ?, capacity = ?, venue_id = ?,
  starts_at = ?, ends_at = ?, updated_at = ?`;
const args = (m: Row, id: string) => [m.title, m.type, m.description, m.capacity, m.venue_id, m.starts_at, m.ends_at, nowIso(), id];

export async function saveDraft(db: D, a: Actor, id: string, patch: Row) {
  requireRole(a, "coordinator");
  const cur = await ownedEvent(db, a, id);
  if (!["draft", "returned"].includes(cur.status))
    throw new DomainError("BAD_STATE", `This event is ${cur.status}; only drafts and returned events can be edited here.`);
  const m = await mergePatch(db, cur, patch);
  await guarded(async () => void (await stmt(db, `${UPDATE_EVENT} WHERE id = ? AND status IN ('draft', 'returned')`, ...args(m, id)).run()));
}

export async function updateEvent(db: D, a: Actor, id: string, patch: Row) {
  requireRole(a, "coordinator");
  const cur = await ownedEvent(db, a, id);
  if (!["pending", "approved", "open"].includes(cur.status))
    throw new DomainError("BAD_STATE", `This event is ${cur.status}; only pending, approved or open events can be changed this way.`);
  const m = await mergePatch(db, cur, patch);
  const { c: confirmed } = (await first(db, "SELECT count(*) AS c FROM registrations WHERE event_id = ? AND status = 'confirmed'", id))!;
  if (m.capacity != null && m.capacity < confirmed)
    throw new DomainError("INVALID_INPUT", `${confirmed} people are already confirmed. Choose ${confirmed} or more.`);
  const body = `The details of "${m.title}" were updated. Open the event to see the new time and venue.`;
  // Clash and resource triggers re-run on the UPDATE (approved/open events), so a bad move rolls the batch back.
  const res = await batch(db, [
    stmt(db, `${UPDATE_EVENT} WHERE id = ?`, ...args(m, id)),
    stmt(db, `INSERT INTO notifications (id, user_id, event_id, kind, body)
              SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'event_changed', ?
              FROM registrations r WHERE r.event_id = ? AND r.status IN ('confirmed', 'waitlisted')`, body, id),
  ]);
  return { notified: res[1].meta.changes };
}

export async function deleteDraft(db: D, a: Actor, id: string) {
  requireRole(a, "coordinator");
  const r = await stmt(db, "DELETE FROM events WHERE id = ? AND coordinator_id = ? AND status IN ('draft', 'returned')", id, a.id).run();
  if (!r.meta.changes) throw new DomainError("NOT_ALLOWED", "Only the event coordinator can delete a draft.");
}

// ---- lifecycle --------------------------------------------------------------------------------
export async function submitEvent(db: D, a: Actor, id: string) {
  requireRole(a, "coordinator");
  const ev = await ownedEvent(db, a, id);
  assertTransition(ev.status, "pending");
  await guarded(async () => void (await stmt(db, "UPDATE events SET status = 'pending', updated_at = ? WHERE id = ?", nowIso(), id).run()));
}

export async function reviewEvent(db: D, a: Actor, id: string, approve: boolean, reason?: string | null) {
  requireRole(a, "admin");
  const why = reason?.trim() ?? "";
  if (!approve && !why) throw new DomainError("INVALID_INPUT", "Say why you are returning this event so the coordinator can fix it.");
  const ev = await first(db, "SELECT id, status, title, coordinator_id FROM events WHERE id = ?", id);
  if (!ev || ev.status !== "pending") throw new DomainError("BAD_STATE", "Only events waiting for review can be approved or returned.");
  const to = approve ? "approved" : "returned";
  const body = approve ? `"${ev.title}" was approved.` : `"${ev.title}" was returned: ${why}`;
  // Approving fires the clash + resource triggers; this is where pending requests that overlap get resolved.
  await batch(db, [
    stmt(db, "UPDATE events SET status = ?, return_reason = ?, updated_at = ? WHERE id = ? AND status = 'pending'", to, approve ? null : why, nowIso(), id),
    stmt(db, `INSERT INTO notifications (id, user_id, event_id, kind, body)
              SELECT lower(hex(randomblob(16))), coordinator_id, id, ?, ? FROM events WHERE id = ? AND status = ?`,
      approve ? "event_approved" : "event_returned", body, id, to),
  ]);
}

export async function cancelEvent(db: D, a: Actor, id: string, reason?: string | null) {
  const ev = await manageableEvent(db, a, id);
  assertTransition(ev.status, "cancelled");
  const why = reason?.trim() || null;
  const body = `"${ev.title}" has been cancelled.` + (why ? ` Reason: ${why}` : "");
  await batch(db, [
    stmt(db, "UPDATE events SET status = 'cancelled', cancel_reason = ?, updated_at = ? WHERE id = ?", why, nowIso(), id),
    stmt(db, `INSERT INTO notifications (id, user_id, event_id, kind, body)
              SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'event_cancelled', ?
              FROM registrations r WHERE r.event_id = ? AND r.status IN ('confirmed', 'waitlisted')`, body, id),
  ]);
}

export async function advanceEvent(db: D, a: Actor, id: string) {
  requireRole(a, "coordinator");
  const ev = await ownedEvent(db, a, id);
  const next: Record<string, string> = { approved: "open", open: "ongoing", ongoing: "completed" };
  if (!next[ev.status]) throw new DomainError("BAD_STATE", "only approved, open or ongoing events can move on.");
  assertTransition(ev.status, next[ev.status]);
  await guarded(async () => void (await stmt(db, "UPDATE events SET status = ?, updated_at = ? WHERE id = ?", next[ev.status], nowIso(), id).run()));
  return next[ev.status];
}

// ---- registrations ----------------------------------------------------------------------------
export async function registerForEvent(db: D, a: Actor, eventId: string): Promise<string> {
  requireRole(a, "student");
  // One statement decides confirmed vs waitlisted and inserts: no check-then-write gap.
  const rows = await guarded(() => all(db,
    `INSERT INTO registrations (id, event_id, user_id, status, created_at)
     SELECT ?, e.id, ?,
            CASE WHEN (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') < e.capacity
                 THEN 'confirmed' ELSE 'waitlisted' END, ?
     FROM events e WHERE e.id = ? AND e.status = 'open'
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = excluded.status, created_at = excluded.created_at
       WHERE registrations.status = 'cancelled'
     RETURNING status`, uuid(), a.id, nowIso(), eventId));
  if (rows.length) return rows[0].status;
  const ev = await first(db, "SELECT status FROM events WHERE id = ?", eventId);
  if (!ev || ev.status !== "open") throw new DomainError("BAD_STATE", "Registration for this event is not open.");
  throw new DomainError("ALREADY_REGISTERED");
}

export async function cancelRegistration(db: D, a: Actor, eventId: string) {
  requireRole(a, "student");
  // The registrations_promote trigger promotes the oldest waitlisted person and notifies them, atomically.
  const rows = await guarded(() => all(db,
    "UPDATE registrations SET status = 'cancelled' WHERE event_id = ? AND user_id = ? AND status IN ('confirmed', 'waitlisted') RETURNING id",
    eventId, a.id));
  if (!rows.length) throw new DomainError("BAD_STATE", "You are not registered for this event.");
}

export async function seatCounts(db: D, a: Actor, eventId: string) {
  const row = await first(db,
    `SELECT e.id,
       (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed,
       (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') AS waitlisted,
       e.capacity
     FROM events e ${VISIBLE[a.role]} AND e.id = ?`, a.id, eventId);
  if (!row) throw new DomainError("NOT_ALLOWED", "You cannot see this event.");
  return { confirmed: row.confirmed, waitlisted: row.waitlisted, capacity: row.capacity };
}

export function listMyRegistrations(db: D, a: Actor) {
  requireRole(a, "student");
  return all(db,
    `SELECT r.event_id, e.title, e.status AS event_status, e.starts_at, e.ends_at, v.name AS venue_name, r.status AS reg_status,
            CASE WHEN r.status = 'waitlisted' THEN 1 + (
                 SELECT COUNT(*) FROM registrations w WHERE w.event_id = r.event_id AND w.status = 'waitlisted'
                   AND (w.created_at < r.created_at OR (w.created_at = r.created_at AND w.id < r.id)))
                 ELSE NULL END AS waitlist_pos
     FROM registrations r JOIN events e ON e.id = r.event_id LEFT JOIN venues v ON v.id = e.venue_id
     WHERE r.user_id = ? ORDER BY e.starts_at, r.id`, a.id);
}

// ---- resource allocations ------------------------------------------------------------------------
export async function setAllocation(db: D, a: Actor, eventId: string, resourceId: string, quantity: number) {
  requireRole(a, "coordinator");
  if (!Number.isInteger(quantity) || quantity < 0) throw new DomainError("INVALID_INPUT", "Quantity must be a whole number, 0 or more.");
  const ev = await ownedEvent(db, a, eventId);
  if (!["draft", "returned", "pending"].includes(ev.status))
    throw new DomainError("BAD_STATE", `This event is ${ev.status}; resources can only be changed before it is approved.`);
  if (quantity === 0) {
    await stmt(db, "DELETE FROM resource_allocations WHERE event_id = ? AND resource_id = ?", eventId, resourceId).run();
    return;
  }
  const res = await first(db, "SELECT id, active FROM resources WHERE id = ?", resourceId);
  if (!res || !res.active) throw new DomainError("INVALID_INPUT", "That resource is not available. Pick another.");
  await guarded(async () => void (await stmt(db,
    `INSERT INTO resource_allocations (id, event_id, resource_id, quantity) VALUES (?, ?, ?, ?)
     ON CONFLICT (event_id, resource_id) DO UPDATE SET quantity = excluded.quantity`, uuid(), eventId, resourceId, quantity).run()));
}

export async function listAllocations(db: D, a: Actor, eventId: string) {
  const ev = await first(db, "SELECT coordinator_id FROM events WHERE id = ?", eventId);
  if (!ev || !["coordinator", "admin"].includes(a.role) || (a.role === "coordinator" && ev.coordinator_id !== a.id))
    throw new DomainError("NOT_ALLOWED");
  return all(db,
    `SELECT a.resource_id, r.name, a.quantity FROM resource_allocations a JOIN resources r ON r.id = a.resource_id
     WHERE a.event_id = ? ORDER BY r.name`, eventId);
}

// ---- venues and resources catalogue --------------------------------------------------------------
const validName = (n: unknown) => {
  const s = n == null ? "" : String(n).trim();
  if (!s) throw new DomainError("INVALID_INPUT", "Give it a name.");
  if (s.length > 80) throw new DomainError("INVALID_INPUT", "Keep the name to 80 characters or fewer.");
  return s;
};
const positiveInt = (v: unknown, field: string) => {
  if (!Number.isInteger(v) || (v as number) < 1) throw new DomainError("INVALID_INPUT", `${field} must be a whole number, 1 or more.`);
  return v as number;
};

export async function listVenues(db: D) {
  return bool(await all(db,
    `SELECT v.id, v.name, v.capacity, v.location, v.active,
            (SELECT COUNT(*) FROM events e WHERE e.venue_id = v.id AND e.status IN ${HELD} AND e.starts_at > ?) AS future_events
     FROM venues v ORDER BY v.active DESC, v.name`, nowIso()), "active");
}

export async function freeVenues(db: D, a: Actor, start: string, end: string, exclude: string | null) {
  requireRole(a, "coordinator", "admin");
  return bool(await all(db,
    `SELECT v.id, v.name, v.capacity, v.location, v.active FROM venues v
     WHERE v.active = 1 AND NOT EXISTS (
       SELECT 1 FROM events e WHERE e.venue_id = v.id AND e.status IN ${HELD}
         AND e.starts_at < ? AND ? < e.ends_at AND e.id <> COALESCE(?, '${NO_ID}'))
     ORDER BY v.name`, end, start, exclude), "active");
}

export function busyVenues(db: D, a: Actor, start: string, end: string, exclude: string | null) {
  requireRole(a, "coordinator", "admin");
  return all(db,
    `SELECT e.venue_id, e.title AS event_title, e.starts_at, e.ends_at FROM events e
     WHERE e.venue_id IS NOT NULL AND e.status IN ${HELD} AND e.starts_at < ? AND ? < e.ends_at
       AND e.id <> COALESCE(?, '${NO_ID}') ORDER BY e.starts_at`, end, start, exclude);
}

export async function saveVenue(db: D, a: Actor, d: Row) {
  requireRole(a, "admin");
  const name = validName(d.name), capacity = positiveInt(d.capacity, "Capacity");
  const location = d.location ? String(d.location).trim() : null, active = d.active === false ? 0 : 1;
  if (!d.id) {
    const id = uuid();
    await guarded(async () => void (await stmt(db, "INSERT INTO venues (id, name, capacity, location, active) VALUES (?, ?, ?, ?, ?)", id, name, capacity, location, active).run()));
    return id;
  }
  const r = await stmt(db, "UPDATE venues SET name = ?, capacity = ?, location = ?, active = ? WHERE id = ?", name, capacity, location, active, d.id).run();
  if (!r.meta.changes) throw new DomainError("INVALID_INPUT", "That venue no longer exists. Refresh the page.");
  return d.id as string;
}

export async function listResources(db: D, a: Actor, from: string | null, to: string | null) {
  requireRole(a, "coordinator", "admin");
  const now = nowIso();
  return bool(await all(db,
    `SELECT r.id, r.name, r.quantity, r.active,
       COALESCE((SELECT SUM(al.quantity) FROM resource_allocations al JOIN events e ON e.id = al.event_id
                 WHERE al.resource_id = r.id AND e.status IN ${HELD} AND e.starts_at < ? AND ? < e.ends_at), 0) AS in_use,
       COALESCE((SELECT MAX(al.quantity) FROM resource_allocations al JOIN events e ON e.id = al.event_id
                 WHERE al.resource_id = r.id AND e.status IN ${HELD} AND e.ends_at > ?), 0) AS reserved_peak
     FROM resources r ORDER BY r.active DESC, r.name`,
    to ?? new Date(Date.now() + 864e5).toISOString(), from ?? now, now), "active");
}

export async function resourceAvailable(db: D, a: Actor, resourceId: string, start: string, end: string, exclude: string | null) {
  requireRole(a, "coordinator", "admin");
  const row = await first(db,
    `SELECT res.quantity - COALESCE((SELECT SUM(al.quantity) FROM resource_allocations al JOIN events e ON e.id = al.event_id
        WHERE al.resource_id = res.id AND e.status IN ${HELD} AND e.starts_at < ? AND ? < e.ends_at
          AND e.id <> COALESCE(?, '${NO_ID}')), 0) AS left
     FROM resources res WHERE res.id = ?`, end, start, exclude, resourceId);
  return { resource_id: resourceId, available: row ? Number(row.left) : 0 };
}

export async function saveResource(db: D, a: Actor, d: Row) {
  requireRole(a, "admin");
  const name = validName(d.name), quantity = positiveInt(d.quantity, "Quantity"), active = d.active === false ? 0 : 1;
  if (!d.id) {
    const id = uuid();
    await guarded(async () => void (await stmt(db, "INSERT INTO resources (id, name, quantity, active) VALUES (?, ?, ?, ?)", id, name, quantity, active).run()));
    return id;
  }
  const row = await first(db,
    `SELECT COALESCE(MAX(al.quantity), 0) AS peak FROM resource_allocations al JOIN events e ON e.id = al.event_id
     WHERE al.resource_id = ? AND e.status IN ${HELD} AND e.ends_at > ?`, d.id, nowIso());
  const peak = Number(row?.peak ?? 0);
  if (quantity < peak) throw new DomainError("INVALID_INPUT", `${peak} are already reserved for events. Choose ${peak} or more.`);
  const r = await stmt(db, "UPDATE resources SET name = ?, quantity = ?, active = ? WHERE id = ?", name, quantity, active, d.id).run();
  if (!r.meta.changes) throw new DomainError("INVALID_INPUT", "That resource no longer exists. Refresh the page.");
  return d.id as string;
}

// ---- tasks and people ---------------------------------------------------------------------------------
const TASK_STATUS: Record<string, string> = { "To do": "todo", Doing: "doing", Done: "done", todo: "todo", doing: "doing", done: "done" };
const TASK_COLS = `t.id, t.event_id, e.title AS event_title, t.title, t.assignee_id, p.name AS assignee_name, t.due_at, t.status, t.completed_at`;

export async function setTaskStatus(db: D, a: Actor, taskId: string, label: string) {
  const status = TASK_STATUS[label];
  if (!status) throw new DomainError("INVALID_INPUT", "Choose To do, Doing or Done.");
  const r = await stmt(db,
    `UPDATE tasks SET status = ?, completed_at = CASE WHEN ? = 'done' THEN ? ELSE NULL END
     WHERE id = ? AND (assignee_id = ? OR ? = 'admin'
       OR event_id IN (SELECT id FROM events WHERE coordinator_id = ? AND ? = 'coordinator'))`,
    status, status, nowIso(), taskId, a.id, a.role, a.id, a.role).run();
  if (!r.meta.changes) throw new DomainError("NOT_ALLOWED", "You cannot change this task.");
}

export async function createTask(db: D, a: Actor, eventId: string, title: string, assigneeId: string | null, dueAt: unknown) {
  requireRole(a, "coordinator");
  const ev = await manageableEvent(db, a, eventId);
  if (["completed", "cancelled"].includes(ev.status))
    throw new DomainError("BAD_STATE", `This event is ${ev.status}; tasks can no longer be added.`);
  const clean = title?.trim();
  if (!clean) throw new DomainError("INVALID_INPUT", "Give the task a title.");
  const id = uuid();
  const stmts = [stmt(db, "INSERT INTO tasks (id, event_id, title, assignee_id, due_at) VALUES (?, ?, ?, ?, ?)", id, eventId, clean, assigneeId || null, ts(dueAt))];
  if (assigneeId)
    stmts.push(stmt(db, "INSERT INTO notifications (id, user_id, event_id, kind, body) VALUES (?, ?, ?, 'task_assigned', ?)",
      uuid(), assigneeId, eventId, `You were given the task "${clean}" for "${ev.title}".`));
  await batch(db, stmts);
  return id;
}

export async function listEventTasks(db: D, a: Actor, eventId: string) {
  await manageableEvent(db, a, eventId);
  return all(db, `SELECT ${TASK_COLS} FROM tasks t JOIN events e ON e.id = t.event_id LEFT JOIN profiles p ON p.id = t.assignee_id
                  WHERE t.event_id = ? ORDER BY t.due_at, t.id`, eventId);
}

export function listCoordinatorTasks(db: D, a: Actor) {
  requireRole(a, "coordinator", "admin");
  return all(db, `SELECT ${TASK_COLS} FROM tasks t JOIN events e ON e.id = t.event_id LEFT JOIN profiles p ON p.id = t.assignee_id
                  WHERE (e.coordinator_id = ? OR ? = 'admin') ORDER BY t.due_at, t.id`, a.id, a.role);
}

export function listMyTasks(db: D, a: Actor) {
  requireRole(a, "student");
  return all(db, `SELECT t.id, t.title, t.event_id, e.title AS event_title, t.due_at, t.status
                  FROM tasks t JOIN events e ON e.id = t.event_id WHERE t.assignee_id = ? ORDER BY t.due_at, t.id`, a.id);
}

export async function listStudents(db: D, a: Actor) {
  requireRole(a, "coordinator", "admin");
  return bool(await all(db, "SELECT id, name, department, is_organizer FROM profiles WHERE role = 'student' ORDER BY name"), "is_organizer");
}

export async function myProfile(db: D, a: Actor) {
  const row = await first(db, "SELECT name, department, is_organizer FROM profiles WHERE id = ?", a.id);
  if (!row) throw new DomainError("NOT_ALLOWED", "We could not find your profile. Sign in again.");
  return { name: row.name, department: row.department, is_organizer: !!row.is_organizer };
}

// ---- notifications and alerts ----------------------------------------------------------------------------
export function listNotifications(db: D, a: Actor) {
  return all(db, "SELECT id, user_id, event_id, kind, body, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC", a.id);
}

export async function unreadCount(db: D, a: Actor) {
  const r = await first(db, "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL", a.id);
  return { count: Number(r?.c ?? 0) };
}

export async function markRead(db: D, a: Actor, id: string) {
  const r = await stmt(db, "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?", nowIso(), id, a.id).run();
  if (!r.meta.changes) {
    const other = await first(db, "SELECT user_id FROM notifications WHERE id = ?", id);
    if (other && other.user_id !== a.id) throw new DomainError("NOT_ALLOWED", "You cannot modify this notification.");
  }
}

export async function notifyRegistrants(db: D, a: Actor, eventId: string, kind: string, body: string) {
  await manageableEvent(db, a, eventId);
  const r = await stmt(db,
    `INSERT INTO notifications (id, user_id, event_id, kind, body)
     SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, ?, ? FROM registrations r
     WHERE r.event_id = ? AND r.status IN ('confirmed', 'waitlisted')`, kind, body, eventId).run();
  return { created: r.meta.changes };
}

const LOWREG_FRACTION = 0.25, LOWREG_DAYS = 7;
const isOverdue = (t: Row, now: Date) => !!t.due_at && t.status !== "done" && new Date(t.due_at) < now;
function isLowReg(ev: Row, now: Date) {
  if (ev.status !== "open" || !ev.capacity || !ev.starts_at) return false;
  const delta = new Date(ev.starts_at).getTime() - now.getTime();
  return delta > 0 && delta <= LOWREG_DAYS * 864e5 && (ev.confirmed ?? 0) < LOWREG_FRACTION * ev.capacity;
}

function alertHref(role: Role, kind: string, eventId: string) {
  if (role === "admin") return kind === "clash" ? "/admin/calendar" : `/admin/approvals/${eventId}`;
  if (role === "coordinator") return `/coordinator/${eventId}`;
  return "/student/tasks";
}

export async function computeAlerts(db: D, a: Actor) {
  const now = new Date();
  const events = await listEventsWithSeats(db, a);
  const tasks = a.role === "student" ? await listMyTasks(db, a) : await listCoordinatorTasks(db, a);
  const bookings = a.role === "admin" ? await listBookings(db, a, new Date(+now - 7 * 864e5).toISOString(), new Date(+now + 60 * 864e5).toISOString()) : [];
  const own = new Set(events.map((e) => e.id));
  const items: { kind: string; key: string; text: string; href: string }[] = [];

  if (a.role === "admin")
    for (const b of bookings) if (b.conflict)
      items.push({ kind: "clash", key: `clash-${b.event_id}`, text: b.conflict, href: alertHref(a.role, "clash", b.event_id) });

  const overdue = new Map<string, { count: number; title: string }>();
  for (const t of tasks) if (isOverdue(t, now)) {
    const o = overdue.get(t.event_id);
    if (o) o.count++; else overdue.set(t.event_id, { count: 1, title: t.event_title ?? "Event" });
  }
  for (const [eid, { count, title }] of overdue)
    items.push({ kind: "overdue", key: `overdue-${eid}`, text: count === 1 ? `1 task is overdue on ${title}` : `${count} tasks are overdue on ${title}`, href: alertHref(a.role, "overdue", eid) });

  if (a.role !== "student")
    for (const ev of events) if (own.has(ev.id) && isLowReg(ev, now))
      items.push({ kind: "lowreg", key: `lowreg-${ev.id}`, text: `${ev.title} has low registrations`, href: alertHref(a.role, "lowreg", ev.id) });

  const order: Record<string, number> = { clash: 0, overdue: 1, lowreg: 2 };
  return items.sort((x, y) => order[x.kind] - order[y.kind] || (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
}

// ---- admin calendar --------------------------------------------------------------------------------------------
const DONE = new Set(["completed", "cancelled"]);

export async function listBookings(db: D, a: Actor, from: string, to: string) {
  requireRole(a, "admin");
  const rows = bool(await all(db,
    `SELECT e.id AS event_id, e.title, e.status, e.department, e.venue_id, v.name AS venue_name, v.active AS venue_active, e.starts_at, e.ends_at
     FROM events e JOIN venues v ON v.id = e.venue_id
     WHERE e.starts_at >= ? AND e.starts_at < ? AND e.status <> 'cancelled' ORDER BY e.starts_at, e.id`, from, to), "venue_active");
  // Pending requests may overlap; the clash is flagged here so the admin resolves it at approval (TT-A1).
  return rows.map((r): Row => {
    let conflict: string | null = null;
    if (!r.venue_active && !DONE.has(r.status)) conflict = `${r.venue_name} is retired. Move this event to another venue.`;
    else {
      const x = rows.find((o) => o.event_id !== r.event_id && o.venue_id === r.venue_id && !DONE.has(o.status) && !DONE.has(r.status)
        && o.starts_at < r.ends_at && r.starts_at < o.ends_at);
      if (x) conflict = `Overlaps "${x.title}" at ${r.venue_name}.`;
    }
    return { ...r, conflict };
  });
}

// ---- reports and CSV ---------------------------------------------------------------------------------------------
const COLUMNS = [
  { key: "title", label: "Title" }, { key: "status", label: "Status" }, { key: "starts_at", label: "Date & Time" },
  { key: "venue", label: "Venue" }, { key: "department", label: "Department" }, { key: "registered", label: "Registered" },
  { key: "capacity", label: "Capacity" }, { key: "overdue_tasks", label: "Overdue tasks" },
];
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", pending: "Pending approval", approved: "Approved", open: "Open", ongoing: "Ongoing",
  completed: "Completed", cancelled: "Cancelled", returned: "Returned",
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function buildReport(db: D, a: Actor, raw: { status?: string | null; from?: string | null; to?: string | null }) {
  requireRole(a, "coordinator", "admin");
  const now = new Date();
  let events = await listEventsWithSeats(db, a);
  if (raw.status && raw.status in STATUS_LABELS) events = events.filter((e) => e.status === raw.status);
  if (raw.from && ISO_DATE.test(raw.from)) events = events.filter((e) => e.starts_at && e.starts_at >= `${raw.from}T00:00:00.000Z`);
  if (raw.to && ISO_DATE.test(raw.to)) events = events.filter((e) => e.starts_at && e.starts_at <= `${raw.to}T23:59:59.999Z`);

  const overdueBy = new Map<string, number>();
  for (const t of await listCoordinatorTasks(db, a)) if (isOverdue(t, now)) overdueBy.set(t.event_id, (overdueBy.get(t.event_id) ?? 0) + 1);

  const rows = events.map((e) => ({
    title: e.title, status: STATUS_LABELS[e.status] ?? e.status, starts_at: e.starts_at, venue: e.venue_name,
    department: e.department, registered: e.confirmed ?? 0, capacity: e.venue_capacity, overdue_tasks: overdueBy.get(e.id) ?? 0,
  }));
  return {
    columns: COLUMNS, rows,
    totals: { events: rows.length, registered: rows.reduce((n, r) => n + (r.registered || 0), 0) },
    generatedAt: now.toISOString(),
  };
}

const cell = (v: unknown) => {
  if (v === null || v === undefined) return '""';
  if (typeof v === "number") return `"${v}"`;
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula injection guard
  return `"${s.replace(/"/g, '""')}"`;
};

export async function exportCsv(db: D, a: Actor, raw: Parameters<typeof buildReport>[2]) {
  const r = await buildReport(db, a, raw);
  const lines = [r.columns.map((c) => cell(c.label)).join(",")];
  for (const row of r.rows) lines.push(r.columns.map((c) => cell((row as Row)[c.key])).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
