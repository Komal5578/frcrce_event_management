import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { isOverdue } from "@/lib/domain/rules";
import { formatShortDate } from "@/lib/format";
import type { TaskRow } from "@/lib/domain/allocations";

/** Tasks of one event: table at 640px and up, cards below. Overdue is a badge with text. */
export function TaskTable({ tasks, now, caption = "Tasks for this event" }: { tasks: TaskRow[]; now: Date; caption?: string }) {
  const key = (t: TaskRow): StatusKey => (isOverdue(t, now) ? "overdue" : (t.status as StatusKey));
  const due = (t: TaskRow) => (t.due_at ? formatShortDate(t.due_at) : "No due date");
  if (!tasks.length) return <p className="text-body">No tasks yet.</p>;
  return (
    <>
      <table className="hidden w-full border-collapse text-left text-body sm:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border-ui text-label">
            <th scope="col" className="py-2 pr-3">Task</th><th scope="col" className="py-2 pr-3">Assigned to</th>
            <th scope="col" className="py-2 pr-3">Due</th><th scope="col" className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-b border-border-card align-top">
              <th scope="row" className="py-3 pr-3 font-semibold">{t.title}</th>
              <td className="py-3 pr-3">{t.assignee_name ?? "Not assigned"}</td>
              <td className="py-3 pr-3">{due(t)}</td>
              <td className="py-3"><StatusBadge status={key(t)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-col gap-2 sm:hidden">
        {tasks.map((t) => (
          <li key={t.id} className="flex flex-col gap-1 rounded-control border border-border-card bg-surface p-4">
            <p className="text-body font-semibold">{t.title}</p>
            <p className="text-label">Assigned to {t.assignee_name ?? "no one"} · Due {due(t)}</p>
            <div><StatusBadge status={key(t)} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
