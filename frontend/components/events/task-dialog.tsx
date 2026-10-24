"use client";

import { useEffect, useId, useRef, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { fromLocalInput } from "@/lib/format";
import type { EventItem, StudentItem } from "@/lib/types";

/** Add a task. Owner is picked from students already known to the system. Event is prefilled when known. */
export function TaskDialog({ open, events, eventId, onClose, onDone }: { open: boolean; events: EventItem[]; eventId?: string; onClose: () => void; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { data: students } = useSWR<StudentItem[]>(open ? "/api/people/students" : null);
  const flash = useFlash();
  const [ev, setEv] = useState(eventId ?? "");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (open && !el.open) { setEv(eventId ?? events[0]?.id ?? ""); setTitle(""); setOwner(""); setDue(""); setErr(""); el.showModal(); }
    if (!open && el.open) el.close();
  }, [open, eventId, events]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ev) return setErr("Pick which event this task belongs to.");
    if (!title.trim()) return setErr("Give the task a short name so the owner knows what to do.");
    setBusy(true); setErr("");
    try {
      await api(`/api/events/${ev}/tasks`, { method: "POST", json: { title: title.trim(), assignee_id: owner || null, due_at: fromLocalInput(due) } });
      flash("Task added."); onDone(); onClose();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  }

  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onClose(); }} aria-labelledby={titleId} className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-surface p-0 text-ink shadow-pop border border-line">
      <form onSubmit={save} className="space-y-4 p-6" noValidate>
        <h2 id={titleId} className="text-xl font-extrabold tracking-tight">Add a task</h2>
        {!eventId ? <Field label="Event" required>{(id) => <Select id={id} value={ev} onChange={(e) => setEv(e.target.value)}>{events.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select>}</Field> : null}
        <Field label="Task" required>{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Print entry passes" autoFocus />}</Field>
        <Field label="Owner" hint="Students already in the system.">{(id) => <Select id={id} value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Unassigned</option>{(students ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}{s.department ? ` · ${s.department}` : ""}</option>)}</Select>}</Field>
        <Field label="Due">{(id) => <Input id={id} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
        {err ? <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">{err}</p> : null}
        <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="secondary" onClick={onClose}>Go back</Button><Button type="submit" loading={busy}>Add task</Button></div>
      </form>
    </dialog>
  );
}
