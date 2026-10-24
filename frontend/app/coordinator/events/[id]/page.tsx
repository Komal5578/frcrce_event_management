"use client";

import { AlarmClock, ArrowLeft, Ban, CalendarCheck, CheckCheck, CircleCheck, CirclePlay, Clock, DoorOpen, Megaphone, Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { isLow } from "@/components/events/event-row";
import { TaskDialog } from "@/components/events/task-dialog";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Stepper } from "@/components/ui/stepper";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { fmtDay, fmtRange, fmtStamp, plural, relative } from "@/lib/format";
import { eventStatus, taskStatus } from "@/lib/status";
import type { EventItem, TaskItem } from "@/lib/types";

const Donut = dynamic(() => import("@/components/ui/charts").then((m) => m.Donut), { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> });

const steps = [
  { label: "Draft", icon: Pencil }, { label: "Pending approval", icon: Clock }, { label: "Approved", icon: ShieldCheck },
  { label: "Open", icon: DoorOpen }, { label: "Ongoing", icon: CirclePlay }, { label: "Completed", icon: CircleCheck },
];
const order = ["draft", "pending", "approved", "open", "ongoing", "completed"];
const nextVerb: Record<string, { verb: string; label: string; say: string }> = {
  approved: { verb: "open registration", label: "Open registration", say: "Students can now see this event and register." },
  open: { verb: "start the event", label: "Mark as ongoing", say: "The event is shown as happening now." },
  ongoing: { verb: "complete the event", label: "Mark as completed", say: "The venue and resources are released and the summary is saved." },
};

export default function EventMonitor() {
  const { id } = useParams<{ id: string }>();
  const { data: e, error, mutate } = useSWR<EventItem>(`/api/events/${id}`);
  const { data: tasks, mutate: mutateTasks } = useSWR<TaskItem[]>(`/api/events/${id}/tasks`);
  const flash = useFlash();
  const [dlg, setDlg] = useState<"advance" | "cancel" | "notify" | null>(null);
  const [addTask, setAddTask] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  if (error) return <ErrorState onRetry={() => mutate()} message="We could not load this event. Your data is safe." />;
  if (!e) return <div className="space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const status = eventStatus(e);
  const idx = order.indexOf(e.status === "returned" ? "draft" : e.status);
  const confirmed = e.confirmed ?? 0, wait = e.waitlisted ?? 0, cap = e.capacity ?? 0;
  const tdone = (tasks ?? []).filter((t) => t.status === "done").length;
  const overdue = (tasks ?? []).filter((t) => taskStatus(t) === "overdue");
  const finished = e.status === "completed";
  const adv = nextVerb[e.status];

  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); flash(ok); } catch (x) { flash(errText(x), { kind: "err" }); }
    setDlg(null); mutate(); mutateTasks();
  }

  return (
    <>
      <PageHeader
        back={<Link href="/coordinator" className="mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden />My Events</Link>}
        title={finished ? `Summary: ${e.title}` : e.title}
        sub={<span className="flex flex-wrap items-center gap-x-3 gap-y-1.5"><StatusBadge status={status} />{isLow(e) ? <StatusBadge status="low" /> : null}<span>{fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)} · {e.venue_name ?? "No venue yet"}</span></span>}
        actions={
          <>
            {["draft", "returned"].includes(e.status) ? <Link href={`/coordinator/new?draft=${e.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-on-brand hover:bg-brand-hover"><Pencil className="size-4" aria-hidden />{e.status === "returned" ? "Fix & resubmit" : "Continue editing"}</Link> : null}
            {adv ? <Button onClick={() => setDlg("advance")}><CalendarCheck className="size-4" aria-hidden />{adv.label}</Button> : null}
            {["open", "ongoing", "completed"].includes(e.status) ? <Button variant="secondary" onClick={() => setDlg("notify")}><Megaphone className="size-4" aria-hidden />Message registrants</Button> : null}
            {["pending", "approved", "open"].includes(e.status) ? <Button variant="secondary" onClick={() => setDlg("cancel")}><Ban className="size-4" aria-hidden />Cancel event</Button> : null}
          </>
        }
      />

      {e.status === "returned" ? (
        <div role="alert" className="mb-5 rounded-2xl bg-[var(--st-returned-bg)] p-4 text-[var(--st-returned-fg)] border border-[var(--st-returned-fg)]/30"><p className="font-extrabold">Sent back by the admin</p><p className="mt-0.5">“{e.return_reason}”. Fix it and submit again.</p></div>
      ) : null}
      {e.status === "cancelled" ? <div role="status" className="mb-5 rounded-2xl bg-[var(--st-cancelled-bg)] p-4 font-semibold text-[var(--st-cancelled-fg)]">This event was cancelled{e.cancel_reason ? `: “${e.cancel_reason}”` : "."} The venue was released.</div> : null}

      {e.status !== "cancelled" ? <div className="mb-6 relative overflow-x-auto rounded-2xl bg-surface-2 p-4 border border-line"><Stepper steps={steps} current={idx} compact /></div> : null}

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Registered" value={confirmed} suffix={cap ? ` / ${cap}` : ""} tone="green" />
        <StatTile label="Waitlisted" value={wait} tone="amber" />
        <StatTile label="Tasks done" value={tdone} suffix={` / ${tasks?.length ?? 0}`} tone="blue" />
        <StatTile label="Overdue tasks" value={overdue.length} tone={overdue.length ? "red" : "slate"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <Card>
          <CardHeader title="Registrations" />
          <div className="p-5">
            <Donut size={150} center={cap ? (confirmed > 0 && confirmed / cap < 0.01 ? "<1%" : `${Math.round((confirmed / cap) * 100)}%`) : String(confirmed)} sub={cap ? "full" : "registered"} data={[{ name: "Registered", value: confirmed, color: "var(--chart-2)" }, { name: "Waitlisted", value: wait, color: "var(--chart-3)" }, { name: "Seats free", value: Math.max(0, cap - confirmed), color: "var(--line-strong)" }]} />
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[15px]">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-faint">Starts</dt><dd className="mt-0.5 font-bold">{relative(e.starts_at) || "Not set"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-faint">Venue seats</dt><dd className="num mt-0.5 font-bold">{e.venue_capacity ?? "–"}</dd></div>
            </dl>
            {isLow(e) ? <p className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--st-low-bg)] p-3 text-sm font-semibold text-[var(--st-low-fg)]"><AlarmClock className="size-4 shrink-0" aria-hidden />Only {confirmed} of {cap} registered and it starts {relative(e.starts_at)}.</p> : null}
          </div>
        </Card>
        <Card>
          <CardHeader title={`Tasks${tasks ? ` (${tasks.length})` : ""}`} aside={!finished && e.status !== "cancelled" ? <Button size="sm" variant="secondary" onClick={() => setAddTask(true)}>Add task</Button> : null} />
          <ul className="divide-y divide-line p-2">
            {!tasks ? <li className="p-3"><Skeleton className="h-10" /></li> : tasks.length === 0 ? <li className="p-5 text-[15px] text-muted">No tasks yet. Add one and pick an owner.</li> : tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                <div className="min-w-0 flex-1 basis-44"><p className="font-bold">{t.title}</p><p className="text-sm text-muted">{t.assignee_name ?? "Unassigned"}{t.due_at ? ` · due ${fmtDay(t.due_at)}` : ""}</p></div>
                <StatusBadge status={taskStatus(t)} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {finished ? <p className="mt-6 flex items-center gap-2 rounded-2xl bg-good-soft p-4 font-semibold text-good"><CheckCheck className="size-5" aria-hidden />Venue and resources have been released. {plural(confirmed, "person", "people")} registered.</p> : null}

      <ConfirmDialog open={dlg === "advance"} verb={adv?.verb ?? "continue"} summary={<p className="font-extrabold">{e.title}</p>} consequence={adv?.say ?? ""} confirmLabel={adv?.label} onConfirm={() => act(() => api(`/api/events/${e.id}/advance`, { method: "POST" }), "Done. The event has moved on.")} onCancel={() => setDlg(null)} />
      <ConfirmDialog open={dlg === "cancel"} verb="cancel the event" destructive summary={<div><p className="font-extrabold">{e.title}</p><p className="text-muted">{fmtStamp(e.starts_at)} · {e.venue_name}</p></div>} consequence={`The event is cancelled, the venue is released, and ${plural(confirmed + wait, "registrant")} will be told in-app.`} confirmLabel="Confirm cancel" onConfirm={() => act(() => api(`/api/events/${e.id}/cancel`, { method: "POST", json: { reason: reason || null } }), `Event cancelled. ${plural(confirmed + wait, "registrant")} notified.`)} onCancel={() => setDlg(null)}>
        <div className="mt-4"><Field label="Reason (optional)" hint="Shown to registrants.">{(i) => <Textarea id={i} value={reason} onChange={(x) => setReason(x.target.value)} />}</Field></div>
      </ConfirmDialog>
      <ConfirmDialog open={dlg === "notify"} verb="send" title="Message everyone registered" summary={<p>{plural(confirmed + wait, "person", "people")} will get this in Notifications.</p>} consequence="Registrants and the waitlist see your message right away. It can't be unsent." confirmLabel="Send message" onConfirm={() => msg.trim() ? act(() => api(`/api/events/${e.id}/notify`, { method: "POST", json: { kind: "announcement", body: msg.trim() } }).then(() => setMsg("")), "Message sent.") : Promise.reject(flash("Write a short message first.", { kind: "err" }))} onCancel={() => setDlg(null)}>
        <div className="mt-4"><Field label="Message" required>{(i) => <Textarea id={i} value={msg} onChange={(x) => setMsg(x.target.value)} />}</Field></div>
      </ConfirmDialog>
      <TaskDialog open={addTask} events={[e]} eventId={e.id} onClose={() => setAddTask(false)} onDone={() => mutateTasks()} />
    </>
  );
}
