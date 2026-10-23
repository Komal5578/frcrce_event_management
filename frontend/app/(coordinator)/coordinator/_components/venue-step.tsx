"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import type { VenueNo, VenueOption } from "../_lib/venues";
import { AutosaveForm } from "./autosave-status";

/** The two groups of the venue picker. Unavailable venues are listed with a reason and cannot be selected. */
export function VenueGroups({ free, unavailable, selected, onSelect, slotSet }: {
  free: VenueOption[]; unavailable: VenueNo[]; selected: string; onSelect: (id: string) => void; slotSet: boolean;
}) {
  if (!slotSet) return <p className="text-body">Choose a date and times to see which venues are free.</p>;
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-heading font-semibold">Free for your slot</legend>
        {free.length === 0 && (
          <div className="rounded-control border border-border-card bg-panel p-4">
            <p className="text-body font-semibold">No venue is free for this time</p>
            <p className="text-body">Try another time or date. Busy venues are listed below with the reason.</p>
          </div>
        )}
        {free.map((v) => (
          <label key={v.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-border-ui bg-surface px-4 py-2 hover:bg-panel has-checked:border-2 has-checked:border-accent has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
            <input type="radio" name="venueId" value={v.id} checked={selected === v.id} onChange={() => onSelect(v.id)} className="size-5 accent-accent" />
            <span className="text-body">{v.name}, capacity {v.capacity}{v.fits ? `, ${v.fits}` : ""}</span>
            {selected === v.id && <Check size={18} aria-hidden="true" />}
          </label>
        ))}
      </fieldset>
      {unavailable.length > 0 && (
        <section aria-labelledby="venues-no">
          <h3 id="venues-no" className="mb-1 text-heading font-semibold">Not available</h3>
          <ul className="flex flex-col gap-2">
            {unavailable.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-control border border-border-card bg-panel px-4 py-2 text-body">
                {v.clash && <StatusBadge status="clash" />}
                <span><span className="font-semibold">{v.name}</span>, capacity {v.capacity}. {v.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Step 2: date, times and venue. Saving the slot refreshes the lists from the saved draft. */
export function VenueStep({ eventId, date, start, end, venueId, free, unavailable }: {
  eventId: string; date: string; start: string; end: string; venueId: string | null; free: VenueOption[]; unavailable: VenueNo[];
}) {
  const [selected, setSelected] = useState(venueId ?? "");
  return (
    <AutosaveForm eventId={eventId} step={2} backHref={`/coordinator/${eventId}/edit?step=1`} nextHref={`/coordinator/${eventId}/edit?step=3`}>
      {(err) => (
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-label text-muted">Times are in college local time.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" error={err.date}><Input type="date" name="date" defaultValue={date} /></Field>
            <Field label="Start time" error={err.start}><Input type="time" name="start" defaultValue={start} /></Field>
            <Field label="End time" error={err.end}><Input type="time" name="end" defaultValue={end} /></Field>
          </div>
          <p className="text-label text-muted">The venue list updates when you leave a date or time field.</p>
          <VenueGroups free={free} unavailable={unavailable} selected={selected} onSelect={setSelected} slotSet={!!(date && start && end)} />
        </div>
      )}
    </AutosaveForm>
  );
}
