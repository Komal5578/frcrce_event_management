"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { startDraft, type ActionState } from "../actions";

type Option = { id: string; name: string; description: string; defaults: string };

/** Step 0: radio group "Start from". The action redirects on success, so only errors come back. */
export function StartForm({ options }: { options: Option[] }) {
  const [state, formAction, pending] = useActionState((_prev: ActionState, fd: FormData) => startDraft(fd), {});
  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-semibold">Start from</legend>
        {options.map((o) => (
          <label key={o.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-control border border-border-ui bg-surface px-4 py-2 hover:bg-panel has-checked:border-2 has-checked:border-accent has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
            <input type="radio" name="template" value={o.id} required className="size-5 accent-accent" />
            <span className="flex flex-col">
              <span className="text-body font-semibold">{o.name}</span>
              <span className="text-label text-muted">{[o.description, o.defaults].filter(Boolean).join(" · ")}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.error && <Alert variant="error" title="Could not start your event">{state.error}</Alert>}
      <div><Button type="submit" loading={pending}>Start</Button></div>
    </form>
  );
}
