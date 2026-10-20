"use client";

import { Field, Input, Textarea } from "@/components/ui/field";
import { AutosaveForm } from "./autosave-status";

/** Step 1: title, department (from the profile), seats, description. */
export function DetailsStep({ eventId, title, seats, description, department }: {
  eventId: string; title: string; seats: number | null; description: string | null; department: string | null;
}) {
  return (
    <AutosaveForm eventId={eventId} step={1} backHref="/coordinator" nextHref={`/coordinator/${eventId}/edit?step=2`}>
      {(err) => (
        <div className="flex max-w-2xl flex-col gap-4">
          <Field label="Title" required error={err.title}><Input name="title" defaultValue={title} maxLength={120} autoComplete="off" /></Field>
          <div className="flex flex-col gap-1">
            <p className="text-label font-semibold">Department</p>
            <p className="text-body">{department ? `${department} (from your profile)` : "Not set on your profile"}</p>
          </div>
          <Field label="Expected seats" required error={err.seats} helper="How many people you plan for.">
            <Input name="seats" inputMode="numeric" defaultValue={seats ?? ""} autoComplete="off" />
          </Field>
          <Field label="Description (optional)"><Textarea name="description" defaultValue={description ?? ""} className="max-w-[65ch]" /></Field>
        </div>
      )}
    </AutosaveForm>
  );
}
