"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { advanceEvent, createDraft, saveDraft, updateEvent } from "@/lib/domain/drafts";
import { cancelEvent, submitEvent } from "@/lib/domain/events";
import { createTask, setAllocation } from "@/lib/domain/allocations";
import { getEventDetail } from "@/lib/domain/views";
import type { Actor } from "@/lib/domain/actor";
import { parseDetails, parseSchedule, parseTask, toFields, type Fields } from "./_lib/parse";

export type ActionState = {
  ok?: true; error?: string; fieldErrors?: Record<string, string>;
  /** registrants told (change, cancel) */ count?: number;
  /** new status after advance */ status?: string;
};

const GENERIC = "Something went wrong on our side. Please try again in a moment.";
type P = { id: string; role: Actor["role"] };

/** Runs one domain call with the session actor; DomainError text is shown, anything else is generic. */
async function run(p: P, eventId: string | null, fn: (actor: Actor) => Promise<Partial<ActionState> | void>): Promise<ActionState> {
  try {
    const extra = await fn({ id: p.id, role: p.role });
    revalidatePath("/coordinator");
    if (eventId) { revalidatePath(`/coordinator/${eventId}`); revalidatePath(`/coordinator/${eventId}/edit`); }
    return { ok: true, ...extra };
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : GENERIC };
  }
}

/** Start from a template id or "blank" (a string or a form with a `template` field). */
export async function startDraft(input: string | FormData): Promise<ActionState> {
  const p = await requireRole("coordinator");
  const raw = typeof input === "string" ? input : String(input.get("template") ?? "");
  if (!raw) return { error: "Choose a template, or Blank, to start." };
  let id = "";
  const r = await run(p, null, async (actor) => { id = await createDraft(actor, raw === "blank" ? null : raw); });
  if (!r.ok) return r;
  redirect(`/coordinator/${id}/edit?step=1`); // outside try/catch: redirect throws
}

/** Reversible autosave: no confirm. step 1 = details, step 2 = date, time and venue. */
export async function saveDraftAction(eventId: string, step: number, input: FormData | Fields): Promise<ActionState> {
  const p = await requireRole("coordinator");
  const f = toFields(input);
  const parsed = step === 1 ? parseDetails(f) : step === 2 ? parseSchedule(f) : null;
  if (!parsed) return { error: "That step has nothing to save here." };
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const patch = { ...parsed.value };
  if (step === 2 && "venueId" in f) patch.venueId = String(f.venueId ?? "") || null;
  return run(p, eventId, (actor) => saveDraft(actor, eventId, patch));
}

export async function setAllocationAction(eventId: string, resourceId: string, quantity: number): Promise<ActionState> {
  const p = await requireRole("coordinator");
  return run(p, eventId, (actor) => setAllocation(actor, eventId, resourceId, quantity));
}

export async function addTaskAction(eventId: string, input: FormData | Fields): Promise<ActionState> {
  const p = await requireRole("coordinator");
  const parsed = parseTask(toFields(input));
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  return run(p, eventId, async (actor) => { await createTask(actor, eventId, parsed.value); });
}

export async function submitAction(eventId: string): Promise<ActionState> {
  const p = await requireRole("coordinator");
  return run(p, eventId, (actor) => submitEvent(actor, eventId));
}

export async function advanceAction(eventId: string): Promise<ActionState> {
  const p = await requireRole("coordinator");
  return run(p, eventId, async (actor) => ({ status: await advanceEvent(actor, eventId) }));
}

export async function cancelAction(eventId: string, reason: string): Promise<ActionState> {
  const p = await requireRole("coordinator");
  return run(p, eventId, async (actor) => {
    const ev = await getEventDetail(actor, eventId);
    await cancelEvent(actor, eventId, String(reason ?? "").slice(0, 500));
    return { count: ev.confirmed + ev.waitlisted };
  });
}

/** Edit a live event (COORD-07): only fields present in the form are changed. */
export async function changeAction(eventId: string, input: FormData | Fields): Promise<ActionState> {
  const p = await requireRole("coordinator");
  const f = toFields(input);
  const patch: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};
  for (const [present, parse] of [["title", parseDetails], ["date", parseSchedule]] as const) {
    if (!(present in f)) continue;
    const r = parse(f);
    if (r.ok) Object.assign(patch, r.value); else Object.assign(fieldErrors, r.fieldErrors);
  }
  if ("venueId" in f) patch.venueId = String(f.venueId ?? "") || null;
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  return run(p, eventId, async (actor) => ({ count: (await updateEvent(actor, eventId, patch)).notified }));
}
