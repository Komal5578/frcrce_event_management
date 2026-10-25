"use client";

import { motion } from "motion/react";
import { AlertTriangle, Building2, Check, CircleCheck, CircleDashed, ClipboardList, CloudCheck, FileText, Minus, Package, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { TaskDialog } from "@/components/events/task-dialog";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Ring } from "@/components/ui/meters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Stepper } from "@/components/ui/stepper";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDay, fmtRange, fromLocalInput, plural, toLocalInput } from "@/lib/format";
import { taskStatus } from "@/lib/status";
import type { AllocationItem, EventItem, ResourceItem, TaskItem, TemplateItem, VenueItem } from "@/lib/types";

const steps = [
  { label: "Details", icon: FileText }, { label: "Venue", icon: Building2 }, { label: "Resources", icon: Package },
  { label: "Tasks", icon: ClipboardList }, { label: "Review", icon: Send },
];

type Busy = { venue_id: string; event_title: string; starts_at: string; ends_at: string };

function Wizard() {
  const router = useRouter();
  const draft = useSearchParams().get("draft");
  const flash = useFlash();
  const [step, setStep] = useState(0);

  // ---------- start from a template ----------
  const { data: templates } = useSWR<TemplateItem[]>("/api/events/templates");
  const [starting, setStarting] = useState<string | null>(null);
  async function start(id: string | null) {
    setStarting(id ?? "blank");
    try {
      const r = await api<{ id: string }>("/api/events/drafts", { method: "POST", json: { template_id: id } });
      router.replace(`/coordinator/new?draft=${r.id}`);
    } catch (e) { flash(errText(e), { kind: "err" }); setStarting(null); }
  }

  if (!draft)
    return (
      <>
        <PageHeader title="New event" sub="Start from a template. We pre-fill your department, size and duration; you only change what is different." />
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {(templates ?? Array.from({ length: 4 }, () => null)).map((t, i) => (
            <li key={t?.id ?? i}>
              {t ? (
                <button onClick={() => start(t.id)} disabled={!!starting} className="group flex h-full min-h-44 w-full flex-col rounded-2xl bg-surface p-5 text-left shadow-card border border-line transition hover:-translate-y-0.5 hover:ring-brand active:scale-[.985] disabled:opacity-60">
                  <span className="num text-[32px] font-extrabold leading-none text-brand">{t.default_capacity ?? "–"}<span className="ml-1 text-sm font-bold text-muted">seats</span></span>
                  <span className="mt-4 text-lg font-extrabold tracking-tight">{starting === t.id ? "Creating…" : t.name}</span>
                  <span className="mt-1 flex-1 text-sm text-muted">{t.description}</span>
                  <span className="num mt-3 text-[13px] font-semibold text-muted">{t.default_duration_minutes ? `${t.default_duration_minutes / 60} hours by default` : ""}</span>
                </button>
              ) : <Skeleton className="h-44 rounded-2xl" />}
            </li>
          ))}
          <li>
            <button onClick={() => start(null)} disabled={!!starting} className="flex h-full min-h-44 w-full flex-col items-start justify-center rounded-2xl border-2 border-dashed border-line-strong p-5 text-left transition hover:border-brand hover:bg-brand-soft/40 disabled:opacity-60">
              <Plus className="size-6 text-brand" aria-hidden /><span className="mt-3 text-lg font-extrabold">{starting === "blank" ? "Creating…" : "Blank event"}</span><span className="text-sm text-muted">Start from nothing.</span>
            </button>
          </li>
        </ul>
        <section aria-labelledby="prefill" className="mt-8">
          <h2 id="prefill" className="text-lg font-extrabold">What we fill in for you</h2>
          <ul className="mt-3 grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
            {[["Your department", "comes from your profile."], ["Size and length", "come from the template, so you only change what is different."], ["Free venues and resources", "are listed for your time slot, so a clash cannot be saved."], ["Everything you type", "saves as you go. Leave and come back to a draft any time."]].map(([lead, rest]) => (
              <li key={lead} className="text-[15px] text-muted"><b className="block text-base text-ink">{lead}</b>{rest}</li>
            ))}
          </ul>
        </section>
      </>
    );

  return <Editor id={draft} step={step} setStep={setStep} />;
}

function Editor({ id, step, setStep }: { id: string; step: number; setStep: (n: number) => void }) {
  const flash = useFlash();
  const { data: ev, mutate } = useSWR<EventItem>(`/api/events/${id}`);
  const { data: templates } = useSWR<TemplateItem[]>("/api/events/templates");
  const [f, setF] = useState({ title: "", description: "", capacity: "", start: "", end: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [discard, setDiscard] = useState(false);
  const [venueSaving, setVenueSaving] = useState(false);
  const router = useRouter();
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (ev && templates && !loaded.current) {
      loaded.current = true;
      // The system knows the template's duration: suggest tomorrow 10:00 so the coordinator only changes what differs.
      let start = toLocalInput(ev.starts_at), end = toLocalInput(ev.ends_at);
      if (!start) {
        const mins = templates.find((t) => t.id === ev.template_id)?.default_duration_minutes ?? 120;
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
        start = toLocalInput(d.toISOString()); end = toLocalInput(new Date(+d + mins * 60000).toISOString());
      }
      setF({ title: ev.title, description: ev.description ?? "", capacity: ev.capacity ? String(ev.capacity) : "", start, end });
    }
  }, [ev, templates]);

  const patch = useCallback(async (body: Record<string, unknown>) => {
    setSave("saving");
    try { await api(`/api/events/${id}/draft`, { method: "PATCH", json: body }); setSave("saved"); mutate(); return true; }
    catch (e) { setSave("error"); flash(errText(e), { kind: "err" }); return false; }
  }, [id, mutate, flash]);

  const set = (k: keyof typeof f, v: string) => {
    const next = { ...f, [k]: v };
    setF(next);
    clearTimeout(timer.current);
    if (!next.title.trim()) return;
    timer.current = setTimeout(() => patch({ title: next.title.trim(), description: next.description || null, capacity: next.capacity ? Number(next.capacity) : null, starts_at: fromLocalInput(next.start), ends_at: fromLocalInput(next.end) }), 700);
  };

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = "Give the event a title so people can find it.";
    if (!f.start) e.start = "Pick when it starts so we can show free venues.";
    if (!f.end) e.end = "Pick when it ends.";
    else if (f.start && new Date(f.end) <= new Date(f.start)) e.end = "It must end after it starts.";
    if (!f.capacity || Number(f.capacity) < 1) e.capacity = "Enter how many people you expect (1 or more).";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  async function next() {
    if (step === 0) {
      if (!validate1()) return;
      clearTimeout(timer.current);
      if (!(await patch({ title: f.title.trim(), description: f.description || null, capacity: Number(f.capacity), starts_at: fromLocalInput(f.start), ends_at: fromLocalInput(f.end) }))) return;
    }
    if (step === 1 && !ev?.venue_id) return flash("Pick a venue to continue.", { kind: "err" });
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ev) return <div className="space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-16" /><Skeleton className="h-80" /></div>;
  if (!["draft", "returned"].includes(ev.status))
    return <div role="status" className="rounded-2xl bg-surface p-8 text-center border border-line"><p className="text-lg font-extrabold">This event is already {ev.status === "pending" ? "pending approval" : ev.status}.</p><Link className="mt-3 inline-block font-bold text-brand" href={`/coordinator/events/${id}`}>Open its page</Link></div>;

  return (
    <>
      <PageHeader
        title={ev.status === "returned" ? "Fix & resubmit" : "New event"}
        sub={`Step ${step + 1} of ${steps.length}: ${steps[step].label}`}
        actions={
          <>
          <Button variant="ghost" onClick={() => setDiscard(true)}>Discard draft</Button>
          <p role="status" className="flex min-h-11 items-center gap-2 text-sm font-semibold text-muted">
            {save === "saving" ? "Saving…" : save === "saved" ? <><CloudCheck className="size-4 text-good" aria-hidden />Saved just now</> : save === "error" ? <span className="text-danger">Not saved. Keep going and we will retry.</span> : "Changes save automatically"}
          </p>
          </>
        }
      />
      {ev.status === "returned" && ev.return_reason ? <div role="alert" className="mb-5 rounded-2xl bg-[var(--st-returned-bg)] p-4 text-[var(--st-returned-fg)]"><p className="font-extrabold">The admin sent this back</p><p>“{ev.return_reason}”</p></div> : null}
      <div className="mb-6 relative overflow-x-auto rounded-2xl bg-surface-2 p-4 border border-line"><Stepper steps={steps} current={step} compact /></div>

      <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        {step === 0 ? (
          <Card className="max-w-3xl p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Title" required error={errs.title}>{(i, d) => <Input id={i} aria-describedby={d} aria-invalid={!!errs.title} value={f.title} onChange={(e) => set("title", e.target.value)} />}</Field></div>
              <Field label="Department" hint="From your profile.">{(i) => <Input id={i} value={ev.department ?? ""} readOnly disabled />}</Field>
              <Field label="Expected attendees" required hint={ev.template_id ? "Pre-filled from the template." : undefined} error={errs.capacity}>{(i, d) => <Input id={i} aria-describedby={d} aria-invalid={!!errs.capacity} type="number" inputMode="numeric" min={1} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} />}</Field>
              <Field label="Starts" required error={errs.start}>{(i, d) => <Input id={i} aria-describedby={d} aria-invalid={!!errs.start} type="datetime-local" value={f.start} onChange={(e) => set("start", e.target.value)} />}</Field>
              <Field label="Ends" required error={errs.end}>{(i, d) => <Input id={i} aria-describedby={d} aria-invalid={!!errs.end} type="datetime-local" value={f.end} onChange={(e) => set("end", e.target.value)} />}</Field>
              <div className="sm:col-span-2"><Field label="Description" hint="Shown to students on the event page.">{(i) => <Textarea id={i} value={f.description} onChange={(e) => set("description", e.target.value)} />}</Field></div>
            </div>
          </Card>
        ) : step === 1 ? <VenueStep ev={ev} onSaving={setVenueSaving} onPicked={() => mutate()} /> : step === 2 ? <ResourceStep ev={ev} /> : step === 3 ? <TaskStep ev={ev} /> : <ReviewStep ev={ev} onBack={() => setStep(3)} />}
      </motion.div>

      <ConfirmDialog open={discard} verb="discard" destructive summary={<p className="font-extrabold">{ev.title}</p>} consequence="This draft and everything you entered is deleted. Nothing is sent to the admin." confirmLabel="Discard draft" onConfirm={async () => { try { await api(`/api/events/${id}/draft`, { method: "DELETE" }); flash("Draft discarded."); router.push("/coordinator"); } catch (e) { flash(errText(e), { kind: "err" }); setDiscard(false); } }} onCancel={() => setDiscard(false)} />
      {step < 4 ? (
        <div className="mt-6 flex max-w-3xl justify-between gap-3">
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Go back</Button>
          <Button onClick={next} disabled={step === 1 && venueSaving}>Next: {steps[step + 1].label}</Button>
        </div>
      ) : null}
    </>
  );
}

function VenueStep({ ev, onSaving, onPicked }: { ev: EventItem; onSaving: (saving: boolean) => void; onPicked: () => Promise<unknown> }) {
  const flash = useFlash();
  const q = `start=${encodeURIComponent(ev.starts_at ?? "")}&end=${encodeURIComponent(ev.ends_at ?? "")}&exclude_event_id=${ev.id}`;
  const { data: free } = useSWR<VenueItem[]>(`/api/venues/free?${q}`);
  const { data: busy } = useSWR<Busy[]>(`/api/venues/busy?${q}`);
  const { data: all } = useSWR<VenueItem[]>("/api/venues");
  const need = ev.capacity ?? 0;
  const freeIds = new Set((free ?? []).map((v) => v.id));
  const taken = (all ?? []).filter((v) => v.active && !freeIds.has(v.id));

  async function pick(v: VenueItem) {
    onSaving(true);
    try { await api(`/api/events/${ev.id}/draft`, { method: "PATCH", json: { venue_id: v.id } }); await onPicked(); flash(`${v.name} selected.`); }
    catch (e) { flash(errText(e), { kind: "err" }); }
    finally { onSaving(false); }
  }
  if (!free || !all) return <Skeleton className="h-64 max-w-3xl rounded-2xl" />;
  return (
    <div className="max-w-3xl space-y-5">
      <p className="text-[15px] text-muted">Free for <b className="text-ink">{fmtDay(ev.starts_at)}, {fmtRange(ev.starts_at, ev.ends_at)}</b>. Only free venues can be chosen, so a clash cannot happen.</p>
      <fieldset>
        <legend className="mb-2 text-base font-extrabold">Free for your slot</legend>
        <div role="group" aria-label="Free venues" className="grid gap-3 sm:grid-cols-2">
          {free.length === 0 ? <p className="rounded-2xl border-2 border-dashed border-line p-6 text-muted sm:col-span-2">No venue is free at that time. Go back and try another time slot.</p> : null}
          {free.map((v) => {
            const small = need > v.capacity; const on = ev.venue_id === v.id;
            return (
              <button key={v.id} aria-pressed={on} disabled={small} onClick={() => pick(v)} className={cn("flex min-h-24 items-start gap-3 rounded-2xl bg-surface p-4 text-left border-2 transition active:scale-[.985] disabled:opacity-60", on ? "border-brand bg-brand-soft/50" : "border-line hover:border-brand")}>
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-brand bg-brand text-on-brand" : "border-line-strong")}>{on ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}</span>
                <span><span className="block font-extrabold">{v.name}</span><span className="block text-sm text-muted">{v.location}</span><span className="num mt-1 block text-sm font-semibold">{small ? <span className="text-[var(--st-full-fg)]">Seats {v.capacity}, you expect {need}</span> : `Seats ${v.capacity}`}</span></span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {taken.length ? (
        <section>
          <h2 className="mb-2 text-base font-extrabold">Not available</h2>
          <ul className="space-y-2">
            {taken.map((v) => { const b = (busy ?? []).find((x) => x.venue_id === v.id); return (
              <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-3.5 border border-line"><span className="min-w-0 flex-1"><b>{v.name}</b> <span className="num text-sm text-muted">· seats {v.capacity}</span>{b ? <span className="block text-sm text-muted">{b.event_title}, {fmtRange(b.starts_at, b.ends_at)}. Pick another venue or another time.</span> : null}</span><StatusBadge status="clash" /></li>
            ); })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ResourceStep({ ev }: { ev: EventItem }) {
  const flash = useFlash();
  const { data: res } = useSWR<ResourceItem[]>("/api/resources");
  const { data: alloc, mutate } = useSWR<AllocationItem[]>(`/api/events/${ev.id}/allocations`);
  const [avail, setAvail] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!res || !ev.starts_at || !ev.ends_at) return;
    Promise.all(res.filter((r) => r.active).map((r) => api<{ available: number }>(`/api/resources/${r.id}/available?start=${encodeURIComponent(ev.starts_at!)}&end=${encodeURIComponent(ev.ends_at!)}&exclude_event_id=${ev.id}`).then((a) => [r.id, a.available] as const).catch(() => [r.id, 0] as const))).then((p) => setAvail(Object.fromEntries(p)));
  }, [res, ev.id, ev.starts_at, ev.ends_at]);
  const mine = useMemo(() => Object.fromEntries((alloc ?? []).map((a) => [a.resource_id, a.quantity])), [alloc]);

  async function setQty(r: ResourceItem, q: number) {
    try { await api(`/api/events/${ev.id}/allocations`, { method: "POST", json: { resource_id: r.id, quantity: q } }); } catch (e) { flash(errText(e), { kind: "err" }); }
    mutate();
  }
  if (!res || !alloc) return <Skeleton className="h-64 max-w-3xl rounded-2xl" />;
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-[15px] text-muted">Reserve what you need. Counts show what is free for your slot; anything booked out is listed, not hidden.</p>
      {res.filter((r) => r.active).map((r) => {
        const free = avail[r.id] ?? 0; const q = mine[r.id] ?? 0; const none = free + q === 0;
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4 shadow-card border border-line">
            <div className="min-w-0 flex-1 basis-48"><p className="font-extrabold">{r.name}</p><p className="num text-sm text-muted">{none ? "All booked for this time" : `${free + q} free for your slot of ${r.quantity}`}</p></div>
            {none ? <StatusBadge status="full" label="All booked" /> : (
              <div className="flex items-center gap-1.5" role="group" aria-label={`${r.name} quantity`}>
                <button aria-label={`Fewer ${r.name}`} disabled={q <= 0} onClick={() => setQty(r, q - 1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-surface-2 border border-line-strong hover:bg-brand-soft disabled:opacity-40"><Minus className="size-4" aria-hidden /></button>
                <output className="num w-10 text-center text-lg font-extrabold" aria-live="polite">{q}</output>
                <button aria-label={`More ${r.name}`} disabled={q >= free + q} onClick={() => setQty(r, q + 1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-40"><Plus className="size-4" aria-hidden /></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaskStep({ ev }: { ev: EventItem }) {
  const { data: tasks, mutate } = useSWR<TaskItem[]>(`/api/events/${ev.id}/tasks`);
  const [add, setAdd] = useState(false);
  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex items-center justify-between gap-3"><p className="text-[15px] text-muted">Optional. Hand out the work now or add tasks later from the Tasks page.</p><Button variant="secondary" onClick={() => setAdd(true)}><Plus className="size-4" aria-hidden />Add task</Button></div>
      {!tasks ? <Skeleton className="h-32 rounded-2xl" /> : tasks.length === 0 ? <p className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-muted">No tasks yet.</p> : tasks.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4 border border-line"><div className="min-w-0 flex-1"><p className="font-bold">{t.title}</p><p className="text-sm text-muted">{t.assignee_name ?? "Unassigned"}{t.due_at ? ` · due ${fmtDay(t.due_at)}` : ""}</p></div><StatusBadge status={taskStatus(t)} /></div>
      ))}
      <TaskDialog open={add} events={[ev]} eventId={ev.id} onClose={() => setAdd(false)} onDone={() => mutate()} />
    </div>
  );
}

function ReviewStep({ ev, onBack }: { ev: EventItem; onBack: () => void }) {
  const flash = useFlash();
  const { data: alloc } = useSWR<AllocationItem[]>(`/api/events/${ev.id}/allocations`);
  const { data: tasks } = useSWR<TaskItem[]>(`/api/events/${ev.id}/tasks`);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const checks = [
    { label: "Title and description", ok: !!ev.title.trim() },
    { label: "Date and time", ok: !!ev.starts_at && !!ev.ends_at },
    { label: "Venue picked", ok: !!ev.venue_id },
    { label: "Expected size", ok: !!ev.capacity },
    { label: "Resources reserved", ok: (alloc ?? []).length > 0, optional: true },
    { label: "Tasks assigned", ok: (tasks ?? []).length > 0, optional: true },
  ];
  const missing = !ev.venue_id || !ev.starts_at || !ev.ends_at || !ev.capacity;

  async function submit() {
    setBusy(true);
    try { await api(`/api/events/${ev.id}/submit`, { method: "POST" }); setSent(true); flash("Sent for approval."); }
    catch (e) { flash(errText(e), { kind: "err" }); } finally { setBusy(false); }
  }

  if (sent)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} role="status" className="max-w-xl rounded-3xl bg-good-soft p-8 text-center border border-line">
        <svg viewBox="0 0 52 52" className="mx-auto size-16" aria-hidden><motion.circle cx="26" cy="26" r="24" fill="none" stroke="var(--good)" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} /><motion.path d="M15 27l8 8 14-16" fill="none" stroke="var(--good)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.4 }} /></svg>
        <h2 className="mt-3 text-2xl font-extrabold">Sent for approval</h2>
        <p className="mt-1 text-muted">We will tell you here when the admin decides. You can still edit until then.</p>
        <div className="mt-5 flex justify-center gap-2"><Link href={`/coordinator/events/${ev.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-bold text-on-brand">Track it</Link><Link href="/coordinator" className="inline-flex min-h-11 items-center rounded-xl bg-surface px-5 font-bold border border-line-strong">Back to My Events</Link></div>
      </motion.div>
    );

  const rows: [string, React.ReactNode][] = [
    ["Event", <b key="t">{ev.title}</b>],
    ["When", `${fmtDay(ev.starts_at)}, ${fmtRange(ev.starts_at, ev.ends_at)}`],
    ["Where", ev.venue_name ? `${ev.venue_name}${ev.venue_location ? `, ${ev.venue_location}` : ""}` : <span key="v" className="font-semibold text-danger">No venue picked yet</span>],
    ["Expected", `${ev.capacity ?? "–"} people · ${ev.department ?? ""}`],
    ["Resources", (alloc ?? []).length ? (alloc ?? []).map((a) => `${a.name} × ${a.quantity}`).join(", ") : "None reserved"],
    ["Tasks", tasks ? (tasks.length ? `${plural(tasks.length, "task")} assigned` : "None yet") : "…"],
  ];
  return (
    <Card className="max-w-3xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-extrabold">Review before you submit</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-surface-2 p-4">
          <Ring value={(checks.filter((c) => !c.optional && c.ok).length / checks.filter((c) => !c.optional).length) * 100} label="Required details complete" size={96} color="var(--good)" />
          <ul className="grid flex-1 gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2" aria-label="Readiness checklist">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                {c.ok ? <CircleCheck className="size-[18px] shrink-0 text-good" aria-hidden /> : <CircleDashed className="size-[18px] shrink-0 text-faint" aria-hidden />}
                <span className={c.ok ? "font-semibold" : "text-muted"}>{c.label}<span className="sr-only">{c.ok ? " (done)" : c.optional ? " (optional, not added)" : " (missing)"}</span>{!c.ok && c.optional ? <span className="text-muted"> · optional</span> : null}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="mt-4 divide-y divide-line rounded-2xl bg-surface-2 border border-line">
          {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-3 text-[15px]"><dt className="font-semibold text-muted">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p className="mt-5 text-[15px] text-muted"><b className="text-ink">What will happen: </b>The admin is asked to approve. You can still edit until they decide, and you will be told here.</p>
        {missing ? <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />A venue, time and expected size are needed before you can submit. Go back to fill them in.</p> : null}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 p-4 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack}>Go back</Button>
        <Button loading={busy} disabled={missing} onClick={submit}>Confirm and submit</Button>
      </div>
    </Card>
  );
}

export default function NewEvent() {
  return <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}><Wizard /></Suspense>;
}
