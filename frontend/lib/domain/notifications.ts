import { getDb } from "@/lib/db";
import { guard } from "@/lib/errors";
import type { Actor } from "./actor";
import { manageableEvent } from "./events";

/** C7, S4: message everyone confirmed or waitlisted; returns rows created. */
export async function notifyRegistrants(actor: Actor, eventId: string, kind: string, body: string): Promise<number> {
  await manageableEvent(actor, eventId);
  const r = await guard(() => getDb().prepare(
    "INSERT INTO notifications (id, user_id, event_id, kind, body) " +
    "SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, ?2, ?3 FROM registrations r " +
    "WHERE r.event_id = ?1 AND r.status IN ('confirmed','waitlisted')").bind(eventId, kind, body).run());
  return r.meta.changes;
}

/** S4: the actor's own notifications, newest first. */
export async function listNotifications(actor: Actor) {
  return guard(async () => (await getDb().prepare(
    "SELECT id, user_id, event_id, kind, body, read_at, created_at FROM notifications WHERE user_id = ?1 ORDER BY created_at DESC")
    .bind(actor.id).all<{ id: string; user_id: string; event_id: string | null; kind: string | null; body: string | null; read_at: string | null; created_at: string }>()).results);
}
