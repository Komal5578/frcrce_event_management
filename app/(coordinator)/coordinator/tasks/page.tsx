import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth";
import { isOverdue } from "@/lib/domain/rules";
import { listCoordinatorTasks, type TaskRow } from "@/lib/domain/allocations";
import { formatShortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Tasks - College Events" };

function Group({ title, rows, now }: { title: string; rows: TaskRow[]; now: Date }) {
  const key = (t: TaskRow): StatusKey => (isOverdue(t, now) ? "overdue" : (t.status as StatusKey));
  const due = (t: TaskRow) => (t.due_at ? formatShortDate(t.due_at) : "No due date");
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-heading font-semibold">{title}</h2>
      <table className="hidden w-full border-collapse text-left text-body sm:table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="border-b border-border-ui text-label">
            <th scope="col" className="py-2 pr-3">Task</th>
            <th scope="col" className="py-2 pr-3">Event</th>
            <th scope="col" className="py-2 pr-3">Assigned to</th>
            <th scope="col" className="py-2 pr-3">Due</th>
            <th scope="col" className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-border-card align-top">
              <th scope="row" className="py-3 pr-3 font-semibold">{t.title}</th>
              <td className="py-3 pr-3"><Link href={`/coordinator/${t.event_id}`} className="underline hover:text-accent">{t.event_title}</Link></td>
              <td className="py-3 pr-3">{t.assignee_name ?? "Not assigned"}</td>
              <td className="py-3 pr-3">{due(t)}</td>
              <td className="py-3"><StatusBadge status={key(t)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-col gap-2 sm:hidden">
        {rows.map((t) => (
          <li key={t.id} className="flex flex-col gap-1 rounded-control border border-border-card bg-panel p-4">
            <p className="text-body font-semibold">{t.title}</p>
            <p className="text-label"><Link href={`/coordinator/${t.event_id}`} className="underline">{t.event_title}</Link></p>
            <p className="text-label">Assigned to {t.assignee_name ?? "no one"} · Due {due(t)}</p>
            <div><StatusBadge status={key(t)} /></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ overdue?: string }> }) {
  const p = await requireRole("coordinator");
  const { overdue: only } = await searchParams;
  const now = new Date();
  const all = await listCoordinatorTasks({ id: p.id, role: p.role });
  const late = all.filter((t) => isOverdue(t, now));
  const rest = only ? [] : all.filter((t) => !isOverdue(t, now));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">Tasks</h1>
      {all.length === 0 ? (
        <div className="rounded-control border border-border-card bg-panel p-6">
          <h2 className="text-heading font-semibold">No tasks yet</h2>
          <p className="text-body">Add tasks on an event page and they show up here.</p>
        </div>
      ) : (
        <>
          <form method="get" aria-label="Filter tasks">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-border-ui bg-surface px-4 text-label font-semibold hover:bg-panel has-checked:border-2 has-checked:border-accent has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
              <input type="checkbox" name="overdue" value="1" defaultChecked={!!only} className="peer sr-only" />
              <Check size={16} aria-hidden="true" className="hidden peer-checked:block" />
              Only overdue
            </label>{" "}
            <button type="submit" className="min-h-11 min-w-11 rounded-control border border-border-ui bg-surface px-4 text-label font-semibold hover:bg-panel">Apply filter</button>
          </form>
          {late.length > 0 && <Group title="Overdue" rows={late} now={now} />}
          {rest.length > 0 && <Group title="Other tasks" rows={rest} now={now} />}
          {only && late.length === 0 && <p className="text-body">No overdue tasks. Nice work.</p>}
        </>
      )}
    </div>
  );
}
