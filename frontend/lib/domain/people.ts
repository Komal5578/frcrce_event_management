import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";

export type StudentRow = { id: string; name: string; department: string | null; is_organizer: number };
export type MyProfile = { name: string; department: string | null; is_organizer: boolean };
export type MyRegistration = {
  event_id: string; title: string; event_status: string; starts_at: string | null; ends_at: string | null;
  venue_name: string | null; reg_status: string; waitlist_pos: number | null;
};
export type MyTask = { id: string; title: string; event_id: string; event_title: string; due_at: string | null; status: string };

/** C4: students a coordinator can assign tasks to (names and departments only). */
export async function listStudents(actor: Actor): Promise<StudentRow[]> {
  requireActorRole(actor, "coordinator", "admin");
  return guard(async () => (await getDb().prepare(
    "SELECT id, name, department, is_organizer FROM profiles WHERE role = 'student' ORDER BY name").all<StudentRow>()).results);
}

/** The actor's own row only (hides My Tasks for non-organizers, prefills the department filter). */
export async function myProfile(actor: Actor): Promise<MyProfile> {
  const p = await guard(() => getDb().prepare("SELECT name, department, is_organizer FROM profiles WHERE id = ?1")
    .bind(actor.id).first<{ name: string; department: string | null; is_organizer: number }>());
  if (!p) throw new DomainError("NOT_ALLOWED", "We could not find your profile. Sign in again.");
  return { name: p.name, department: p.department, is_organizer: p.is_organizer === 1 };
}

/** S4: own registrations incl. cancelled; waitlist_pos is 1-based by created_at then id. */
export async function listMyRegistrations(actor: Actor): Promise<MyRegistration[]> {
  requireActorRole(actor, "student");
  return guard(async () => (await getDb().prepare(
    "SELECT r.event_id, e.title, e.status AS event_status, e.starts_at, e.ends_at, v.name AS venue_name, r.status AS reg_status, " +
    "CASE WHEN r.status = 'waitlisted' THEN 1 + (SELECT count(*) FROM registrations w WHERE w.event_id = r.event_id AND w.status = 'waitlisted' " +
    "AND (w.created_at < r.created_at OR (w.created_at = r.created_at AND w.id < r.id))) END AS waitlist_pos " +
    "FROM registrations r JOIN events e ON e.id = r.event_id LEFT JOIN venues v ON v.id = e.venue_id " +
    "WHERE r.user_id = ?1 ORDER BY e.starts_at, r.id").bind(actor.id).all<MyRegistration>()).results);
}

/** S5: tasks assigned to the student. */
export async function listMyTasks(actor: Actor): Promise<MyTask[]> {
  requireActorRole(actor, "student");
  return guard(async () => (await getDb().prepare(
    "SELECT t.id, t.title, t.event_id, e.title AS event_title, t.due_at, t.status FROM tasks t JOIN events e ON e.id = t.event_id " +
    "WHERE t.assignee_id = ?1 ORDER BY t.due_at, t.id").bind(actor.id).all<MyTask>()).results);
}
