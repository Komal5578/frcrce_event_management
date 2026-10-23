import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";
import { manageableEvent } from "./events";
import { validIso } from "./drafts";

export type AllocationRow = { resource_id: string; name: string; quantity: number };
export type TaskRow = {
  id: string; event_id: string; event_title: string; title: string; assignee_id: string | null; assignee_name: string | null;
  due_at: string | null; status: string; completed_at: string | null;
};

const bad = (m: string) => new DomainError("INVALID_INPUT", m);
const TASKS =
  "SELECT t.id, t.event_id, e.title AS event_title, t.title, t.assignee_id, p.name AS assignee_name, t.due_at, t.status, t.completed_at " +
  "FROM tasks t JOIN events e ON e.id = t.event_id LEFT JOIN profiles p ON p.id = t.assignee_id";

export async function listAllocations(actor: Actor, eventId: string): Promise<AllocationRow[]> {
  await manageableEvent(actor, eventId);
  return guard(async () => (await getDb().prepare(
    "SELECT a.resource_id, r.name, a.quantity FROM resource_allocations a JOIN resources r ON r.id = a.resource_id " +
    "WHERE a.event_id = ?1 ORDER BY r.name").bind(eventId).all<AllocationRow>()).results);
}

/** C3: set how many of a resource an event holds (0 removes). The DB refuses over-allocation. */
export async function setAllocation(actor: Actor, eventId: string, resourceId: string, quantity: number): Promise<void> {
  requireActorRole(actor, "coordinator");
  if (!Number.isInteger(quantity) || quantity < 0) throw bad("Quantity must be a whole number, 0 or more.");
  const db = getDb();
  const e = await guard(() => db.prepare("SELECT status FROM events WHERE id = ?1 AND coordinator_id = ?2").bind(eventId, actor.id).first<{ status: string }>());
  if (!e) throw new DomainError("NOT_ALLOWED", "Only the event coordinator can do that.");
  if (!["draft", "returned", "pending"].includes(e.status))
    throw new DomainError("BAD_STATE", `This event is ${e.status}; resources can only be changed before it is approved.`);
  if (quantity === 0) {
    await guard(() => db.prepare("DELETE FROM resource_allocations WHERE event_id = ?1 AND resource_id = ?2").bind(eventId, resourceId).run());
    return;
  }
  const r = await guard(() => db.prepare(
    "INSERT INTO resource_allocations (id, event_id, resource_id, quantity) SELECT ?1, ?2, r.id, ?4 FROM resources r WHERE r.id = ?3 AND r.active = 1 " +
    "ON CONFLICT(event_id, resource_id) DO UPDATE SET quantity = excluded.quantity")
    .bind(crypto.randomUUID(), eventId, resourceId, quantity).run());
  if (r.meta.changes === 0) throw bad("That resource is not available. Pick another.");
}

export async function listEventTasks(actor: Actor, eventId: string): Promise<TaskRow[]> {
  await manageableEvent(actor, eventId);
  return guard(async () => (await getDb().prepare(TASKS + " WHERE t.event_id = ?1 ORDER BY t.due_at, t.id").bind(eventId).all<TaskRow>()).results);
}

/** C4: tasks across the coordinator's own events (admin: all). */
export async function listCoordinatorTasks(actor: Actor): Promise<TaskRow[]> {
  requireActorRole(actor, "coordinator", "admin");
  return guard(async () => (await getDb().prepare(
    TASKS + " WHERE (e.coordinator_id = ?1 OR ?2 = 'admin') ORDER BY t.due_at, t.id").bind(actor.id, actor.role).all<TaskRow>()).results);
}

/** C4: owner gives a student a task and they are told, in one batch. */
export async function createTask(actor: Actor, eventId: string, t: { title: string; assigneeId: string; dueAt: string }): Promise<string> {
  requireActorRole(actor, "coordinator");
  const db = getDb();
  const e = await guard(() => db.prepare("SELECT status, title FROM events WHERE id = ?1 AND coordinator_id = ?2").bind(eventId, actor.id).first<{ status: string; title: string }>());
  if (!e) throw new DomainError("NOT_ALLOWED", "Only the event coordinator can do that.");
  if (["completed", "cancelled"].includes(e.status)) throw new DomainError("BAD_STATE", `This event is ${e.status}; tasks can no longer be added.`);
  const title = typeof t.title === "string" ? t.title.trim() : "";
  if (!title) throw bad("Give the task a title.");
  if (title.length > 120) throw bad("Keep the task title to 120 characters or fewer.");
  if (!validIso(t.dueAt)) throw bad("The due date is not a valid date and time.");
  const s = await guard(() => db.prepare("SELECT 1 AS ok FROM profiles WHERE id = ?1 AND role = 'student'").bind(t.assigneeId).first());
  if (!s) throw bad("Pick a student to give the task to.");
  const id = crypto.randomUUID();
  await guard(() => db.batch([
    db.prepare("INSERT INTO tasks (id, event_id, title, assignee_id, due_at) SELECT ?1, e.id, ?3, ?4, ?5 FROM events e WHERE e.id = ?2 AND e.coordinator_id = ?6")
      .bind(id, eventId, title, t.assigneeId, t.dueAt, actor.id),
    db.prepare(
      "INSERT INTO notifications (id, user_id, event_id, kind, body) SELECT lower(hex(randomblob(16))), ?2, ?3, 'task_assigned', ?4 " +
      "WHERE EXISTS (SELECT 1 FROM tasks WHERE id = ?1)").bind(id, t.assigneeId, eventId, `You were given the task "${title}" for "${e.title}".`),
  ]));
  return id;
}
