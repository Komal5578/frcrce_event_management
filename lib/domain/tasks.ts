import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import type { Actor } from "./actor";

const STATUS: Record<string, string> = { "To do": "todo", Doing: "doing", Done: "done" };

/** S5, C4: assignee, owning coordinator or admin sets To do / Doing / Done. */
export async function setTaskStatus(actor: Actor, taskId: string, label: string): Promise<void> {
  const status = STATUS[label];
  if (!status) throw new DomainError("INVALID_INPUT", "Choose To do, Doing or Done.");
  const r = await guard(() => getDb().prepare(
    "UPDATE tasks SET status = ?1, completed_at = CASE WHEN ?1 = 'done' THEN strftime('%Y-%m-%dT%H:%M:%fZ','now') ELSE NULL END " +
    "WHERE id = ?2 AND (assignee_id = ?3 OR ?4 = 'admin' OR event_id IN (SELECT id FROM events WHERE coordinator_id = ?3 AND ?4 = 'coordinator'))")
    .bind(status, taskId, actor.id, actor.role).run());
  if (r.meta.changes === 0) throw new DomainError("NOT_ALLOWED", "You cannot change this task.");
}
