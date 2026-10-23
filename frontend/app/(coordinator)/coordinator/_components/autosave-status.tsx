"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveDraftAction } from "../actions";

type Errors = Record<string, string>;
type S = "idle" | "saving" | "saved" | "error";

export const LINK_BTN = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-ui bg-surface px-4 py-2 text-label font-semibold text-ink hover:bg-panel";

/** The aria-live status next to the footer. The draft lives in the database. */
export function AutosaveStatus({ state, saveError }: { state: S; saveError?: string }) {
  return (
    <span aria-live="polite" className="inline-flex min-h-6 items-center gap-1 text-label text-muted">
      {state === "saving" && "Saving..."}
      {state === "saved" && <><Check size={16} aria-hidden="true" />Saved just now</>}
      {state === "error" && <><CircleAlert size={16} aria-hidden="true" />{saveError ?? "Not saved. Check your connection. Your last saved version is kept."}</>}
    </span>
  );
}

/**
 * A step form that autosaves on blur (debounced 800 ms) and has the shared footer:
 * Go back, one primary "Save and continue", "Save and close". step 1 = details, 2 = date, time and venue.
 */
export function AutosaveForm({ eventId, step, backHref, nextHref, children }: {
  eventId: string; step: 1 | 2; backHref: string; nextHref: string;
  children: (errors: Errors) => ReactNode;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [state, setState] = useState<S>("idle");
  const [saveError, setSaveError] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});

  async function save(): Promise<boolean> {
    clearTimeout(timer.current);
    if (!form.current) return false;
    setState("saving");
    try {
      const r = await saveDraftAction(eventId, step, new FormData(form.current));
      if (r.ok) { setErrors({}); setState("saved"); setSaveError(undefined); router.refresh(); return true; }
      setErrors(r.fieldErrors ?? {});
      setSaveError(r.error); // a domain sentence (e.g. clash) or undefined for field errors
      setState(r.fieldErrors ? "idle" : "error");
    } catch {
      setState("error");
    }
    return false;
  }
  const later = () => { clearTimeout(timer.current); timer.current = setTimeout(save, 800); };

  return (
    <form
      ref={form}
      noValidate
      onBlur={later}
      onChange={later}
      onSubmit={async (e) => { e.preventDefault(); if (await save()) router.push(nextHref); }}
      className="flex flex-col gap-6"
    >
      {children(errors)}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="flex items-center gap-1 text-label font-semibold text-destructive">
          <CircleAlert size={16} aria-hidden="true" />Fix the fields marked above, then continue.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="submit" className="order-first sm:order-2">Save and continue</Button>
        <Link href={backHref} className={`${LINK_BTN} sm:order-1`}>Go back</Link>
        <button type="button" onClick={async () => { if (await save()) router.push("/coordinator"); }}
          className="order-last inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-label font-semibold underline">Save and close</button>
        <AutosaveStatus state={state} saveError={saveError} />
      </div>
    </form>
  );
}
