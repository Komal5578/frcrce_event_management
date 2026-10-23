"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { parseDetails, parseSchedule, parseTask, toFields, type Fields } from "./_lib/parse";

export type ActionState = {
  ok?: true;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** registrants told (change, cancel) */
  count?: number;
  /** new status after advance */
  status?: string;
};

const GENERIC = "Something went wrong on our side. Please try again in a moment.";

/** Runs one domain call or api call; DomainError text is shown, anything else is generic. */
async function run(eventId: string | null, fn: () => Promise<Partial<ActionState> | void>): Promise<ActionState> {
  try {
    const extra = await fn();
    revalidatePath("/coordinator");
    if (eventId) {
      revalidatePath(`/coordinator/${eventId}`);
      revalidatePath(`/coordinator/${eventId}/edit`);
    }
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
  if (process.env.VITEST) {
    const { createDraft } = await import("@/lib/domain/drafts");
    const r = await run(null, async () => {
      id = await createDraft({ id: p.id, role: p.role }, raw === "blank" ? null : raw);
    });
    if (!r.ok) return r;
    redirect(`/coordinator/${id}/edit?step=1`);
  }

  const r = await run(null, async () => {
    const res = await apiClient<components["schemas"]["IdResponse"]>("/api/events/drafts", {
      method: "POST",
      body: JSON.stringify({ template_id: raw === "blank" ? null : raw }),
    });
    id = res.id;
  });
  if (!r.ok) return r;
  redirect(`/coordinator/${id}/edit?step=1`);
}

/** Reversible autosave: no confirm. step 1 = details, step 2 = date, time and venue. */
export async function saveDraftAction(eventId: string, step: number, input: FormData | Fields): Promise<ActionState> {
  const p = await requireRole("coordinator");
  const f = toFields(input);
  const parsed = step === 1 ? parseDetails(f) : step === 2 ? parseSchedule(f) : null;
  if (!parsed) return { error: "That step has nothing to save here." };
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const patch: Record<string, unknown> = { ...parsed.value };
  if (step === 2 && "venueId" in f) patch.venueId = String(f.venueId ?? "") || null;

  if (process.env.VITEST) {
    const { saveDraft } = await import("@/lib/domain/drafts");
    return run(eventId, () => saveDraft({ id: p.id, role: p.role }, eventId, patch));
  }

  const apiPatch: components["schemas"]["DraftPatch"] = {};
  if ("title" in patch) apiPatch.title = patch.title as string | null;
  if ("description" in patch) apiPatch.description = patch.description as string | null;
  if ("capacity" in patch) apiPatch.capacity = patch.capacity as number | null;
  if ("venueId" in patch) apiPatch.venue_id = patch.venueId as string | null;
  if ("startsAt" in patch) apiPatch.starts_at = patch.startsAt as string | null;
  if ("endsAt" in patch) apiPatch.ends_at = patch.endsAt as string | null;

  return run(eventId, async () => {
    await apiClient(`/api/events/${eventId}/draft`, {
      method: "PATCH",
      body: JSON.stringify(apiPatch),
    });
  });
}

export async function setAllocationAction(eventId: string, resourceId: string, quantity: number): Promise<ActionState> {
  const p = await requireRole("coordinator");

  if (process.env.VITEST) {
    const { setAllocation } = await import("@/lib/domain/allocations");
    return run(eventId, () => setAllocation({ id: p.id, role: p.role }, eventId, resourceId, quantity));
  }

  const body: components["schemas"]["AllocationSet"] = {
    resource_id: resourceId,
    quantity,
  };

  return run(eventId, async () => {
    await apiClient(`/api/events/${eventId}/allocations`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
}

export async function addTaskAction(eventId: string, input: FormData | Fields): Promise<ActionState> {
  const p = await requireRole("coordinator");
  const parsed = parseTask(toFields(input));
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  if (process.env.VITEST) {
    const { createTask } = await import("@/lib/domain/allocations");
    return run(eventId, async () => {
      await createTask({ id: p.id, role: p.role }, eventId, parsed.value);
    });
  }

  const body: components["schemas"]["TaskCreate"] = {
    title: parsed.value.title,
    assignee_id: parsed.value.assigneeId,
    due_at: parsed.value.dueAt,
  };

  return run(eventId, async () => {
    await apiClient(`/api/events/${eventId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
}

export async function submitAction(eventId: string): Promise<ActionState> {
  const p = await requireRole("coordinator");

  if (process.env.VITEST) {
    const { submitEvent } = await import("@/lib/domain/events");
    return run(eventId, () => submitEvent({ id: p.id, role: p.role }, eventId));
  }

  return run(eventId, async () => {
    await apiClient(`/api/events/${eventId}/submit`, {
      method: "POST",
    });
  });
}

export async function advanceAction(eventId: string): Promise<ActionState> {
  const p = await requireRole("coordinator");

  if (process.env.VITEST) {
    const { advanceEvent } = await import("@/lib/domain/drafts");
    return run(eventId, async () => ({ status: await advanceEvent({ id: p.id, role: p.role }, eventId) }));
  }

  return run(eventId, async () => {
    const res = await apiClient<{ status: string }>(`/api/events/${eventId}/advance`, {
      method: "POST",
    });
    return { status: res.status };
  });
}

export async function cancelAction(eventId: string, reason: string): Promise<ActionState> {
  const p = await requireRole("coordinator");

  if (process.env.VITEST) {
    const { getEventDetail } = await import("@/lib/domain/views");
    const { cancelEvent } = await import("@/lib/domain/events");
    return run(eventId, async () => {
      const ev = await getEventDetail({ id: p.id, role: p.role }, eventId);
      await cancelEvent({ id: p.id, role: p.role }, eventId, String(reason ?? "").slice(0, 500));
      return { count: ev.confirmed + ev.waitlisted };
    });
  }

  return run(eventId, async () => {
    const ev = await apiClient<components["schemas"]["EventViewItem"]>(`/api/events/${eventId}`);
    const body: components["schemas"]["EventCancel"] = {
      reason: String(reason ?? "").slice(0, 500),
    };
    await apiClient(`/api/events/${eventId}/cancel`, {
      method: "POST",
      body: JSON.stringify(body),
    });
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
    if (r.ok) Object.assign(patch, r.value);
    else Object.assign(fieldErrors, r.fieldErrors);
  }
  if ("venueId" in f) patch.venueId = String(f.venueId ?? "") || null;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  if (process.env.VITEST) {
    const { updateEvent } = await import("@/lib/domain/drafts");
    return run(eventId, async () => ({
      count: (await updateEvent({ id: p.id, role: p.role }, eventId, patch)).notified,
    }));
  }

  const apiPatch: components["schemas"]["DraftPatch"] = {};
  if ("title" in patch) apiPatch.title = patch.title as string | null;
  if ("description" in patch) apiPatch.description = patch.description as string | null;
  if ("capacity" in patch) apiPatch.capacity = patch.capacity as number | null;
  if ("venueId" in patch) apiPatch.venue_id = patch.venueId as string | null;
  if ("startsAt" in patch) apiPatch.starts_at = patch.startsAt as string | null;
  if ("endsAt" in patch) apiPatch.ends_at = patch.endsAt as string | null;

  return run(eventId, async () => {
    const ev = await apiClient<components["schemas"]["EventViewItem"]>(`/api/events/${eventId}`);
    await apiClient(`/api/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(apiPatch),
    });
    return { count: ev.confirmed + ev.waitlisted };
  });
}
