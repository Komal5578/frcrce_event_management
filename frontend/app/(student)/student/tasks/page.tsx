import { requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { TaskCard } from "../_components/task-card";
import { orderTasks, taskBadge, type MyTask } from "../_lib/mine";

export const metadata = { title: "My tasks - College Events" };
export const dynamic = "force-dynamic";

export default async function Page() {
  await requireRole("student");
  const now = new Date();
  // Non-organizers simply have no tasks, so they get the empty state, not an error.
  const rawTasks = await apiClient<MyTask[]>("/api/tasks/mine").catch(() => []);
  const tasks = orderTasks(rawTasks, now);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">My tasks</h1>
      {tasks.length === 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-heading font-semibold">You have no tasks</h2>
          <p className="text-body">Tasks appear here when a coordinator assigns you one.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} id={t.id} title={t.title} eventId={t.event_id} eventTitle={t.event_title}
              due={t.due_at ? formatShortDate(t.due_at) : null} badge={taskBadge(t, now)} done={t.status === "done"} />
          ))}
        </ul>
      )}
    </div>
  );
}
