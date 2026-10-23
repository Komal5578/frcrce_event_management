"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { changeAction, type ActionState } from "../actions";
import type { VenueNo, VenueOption } from "../_lib/venues";
import { ConfirmFlow } from "./confirm-flow";
import { VenueGroups } from "./venue-step";

type V = { title: string; seats: string; description: string; date: string; start: string; end: string; venueId: string };
const LABEL: Record<keyof V, string> = { title: "Title", seats: "Seats", description: "Description", date: "Date", start: "Start time", end: "End time", venueId: "Venue" };

/** COORD-07: edit a pending, approved or open event. Review & Confirm shows Before / After for each changed field. */
export function ChangeForm({ eventId, initial, venueNames, free, unavailable }: {
  eventId: string; initial: V; venueNames: Record<string, string>; free: VenueOption[]; unavailable: VenueNo[];
}) {
  const [v, setV] = useState<V>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof V) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const changed = (Object.keys(v) as (keyof V)[]).filter((k) => v[k].trim() !== initial[k].trim());
  const show = (k: keyof V, x: string) => (k === "venueId" ? venueNames[x] ?? "Not chosen" : x.trim() || "Empty");

  async function save(): Promise<ActionState> {
    const r = await changeAction(eventId, { ...v });
    setErrors(r.fieldErrors ?? {});
    return r.fieldErrors ? { error: "Some fields need fixing. Check the messages in the form, then try again." } : r;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-2xl flex-col gap-4">
        <Field label="Title" required error={errors.title}><Input value={v.title} onChange={set("title")} maxLength={120} autoComplete="off" /></Field>
        <Field label="Expected seats" required error={errors.seats}><Input inputMode="numeric" value={v.seats} onChange={set("seats")} autoComplete="off" /></Field>
        <Field label="Description (optional)"><Textarea value={v.description} onChange={set("description")} className="max-w-[65ch]" /></Field>
        <p className="text-label text-muted">Times are in college local time.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" error={errors.date}><Input type="date" value={v.date} onChange={set("date")} /></Field>
          <Field label="Start time" error={errors.start}><Input type="time" value={v.start} onChange={set("start")} /></Field>
          <Field label="End time" error={errors.end}><Input type="time" value={v.end} onChange={set("end")} /></Field>
        </div>
        <p className="text-label text-muted">The venue list shows the saved time. Venue and time checks run again when you save.</p>
        <VenueGroups free={free} unavailable={unavailable} selected={v.venueId} onSelect={(id) => setV((s) => ({ ...s, venueId: id }))} slotSet />
      </div>
      <ConfirmFlow
        key="change"
        triggerLabel="Review changes"
        verb="save changes"
        disabledReason={changed.length ? null : "Change something to save."}
        summary={
          <dl className="flex flex-col gap-2 text-body">
            {changed.map((k) => (
              <div key={k}><dt className="font-semibold">{LABEL[k]}</dt><dd>Before: {show(k, initial[k])}<br />After: {show(k, v[k])}</dd></div>
            ))}
          </dl>
        }
        consequence="Registrants are told about the change in the app. Venue and time checks run again."
        action={save}
        successTitle="Changes saved"
        successBody="{n} registrants have been notified."
      />
    </div>
  );
}
