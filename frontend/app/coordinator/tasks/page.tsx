"use client";

import { ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { TaskDialog } from "@/components/events/task-dialog";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { ListSkeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { fmtDay } from "@/lib/format";
import { useMe } from "@/lib/session";
import { taskStatus, type StatusKey } from "@/lib/status";
import type { EventItem, TaskItem } from "@/lib/types";

export default function CoordinatorTasks() {
  const { me } = useMe();
  const { data, error, mutate } = useSWR<TaskItem[]>("/api/tasks/coordinator");
  const { data: events } = useSWR<EventItem[]>("/api/events");
  const flash = useFlash();
  const [ev, setEv] = useState("");
  const [st, setSt] = useState<"" | StatusKey>("");
  const [add, setAdd] = useState(false);
  const mine = (events ?? []).filter((e) => e.coordinator_id === me?.id && !["cancelled", "completed"].includes(e.status));

  const rows = (data ?? []).filter((t) => (!ev || t.event_id === ev) && (!st || taskStatus(t) === st));

  async function setStatus(t: TaskItem, label: string) {
    try { await api(`/api/tasks/${t.id}/status`, { method: "PATCH", json: { label } }); flash("Task updated."); } catch (e) { flash(errText(e), { kind: "err" }); }
    mutate();
  }

  return (
    <>
      <PageHeader title="Tasks" sub="All tasks across your events." actions={<Button onClick={() => setAdd(true)} disabled={!mine.length}><Plus className="size-4" aria-hidden />Add task</Button>} />
      {data ? (
        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatTile label="To do" value={data.filter((t) => taskStatus(t) === "todo").length} tone="slate" />
          <StatTile label="In progress" value={data.filter((t) => taskStatus(t) === "doing").length} tone="blue" />
          <StatTile label="Overdue" value={data.filter((t) => taskStatus(t) === "overdue").length} tone="red" />
          <StatTile label="Done" value={data.filter((t) => taskStatus(t) === "done").length} tone="green" />
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-muted">Event
          <Select value={ev} onChange={(e) => setEv(e.target.value)} className="w-56"><option value="">All events</option>{[...new Map((data ?? []).map((t) => [t.event_id, t.event_title])).entries()].map(([id, n]) => <option key={id} value={id}>{n}</option>)}</Select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-muted">Status
          <Select value={st} onChange={(e) => setSt(e.target.value as "" | StatusKey)} className="w-44"><option value="">All</option><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option><option value="overdue">Overdue</option></Select>
        </label>
      </div>

      {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <ListSkeleton rows={4} h="h-16" /> : rows.length === 0 ? (
        <EmptyState art="tasks" icon={ListChecks} title="No tasks here" body="Add a task and pick who owns it." action={mine.length ? <Button onClick={() => setAdd(true)}><Plus className="size-4" aria-hidden />Add task</Button> : undefined} />
      ) : (
        <div className="relative overflow-x-auto rounded-2xl bg-surface shadow-card border border-line">
          <table className="w-full min-w-[44rem] text-left text-[15px]">
            <caption className="sr-only">Tasks across your events</caption>
            <thead><tr className="border-b border-line text-sm text-muted">{["Task", "Event", "Owner", "Due", "Status", "Change"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <th scope="row" className="px-4 py-3 font-bold">{t.title}</th>
                    <td className="px-4 py-3 text-muted">{t.event_title}</td>
                    <td className="px-4 py-3">{t.assignee_name ?? <span className="text-faint">Unassigned</span>}</td>
                    <td className="num px-4 py-3 text-muted">{t.due_at ? fmtDay(t.due_at) : "–"}</td>
                    <td className="px-4 py-3"><StatusBadge status={taskStatus(t)} /></td>
                    <td className="px-4 py-2"><label className="sr-only" htmlFor={`s-${t.id}`}>Change status of {t.title}</label>
                      <Select id={`s-${t.id}`} value="" onChange={(e) => e.target.value && setStatus(t, e.target.value)} className="w-36"><option value="">Move to…</option><option>To do</option><option>Doing</option><option>Done</option></Select></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      <TaskDialog open={add} events={mine} onClose={() => setAdd(false)} onDone={() => mutate()} />
    </>
  );
}
