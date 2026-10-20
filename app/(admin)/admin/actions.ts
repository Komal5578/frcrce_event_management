"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { reviewEvent } from "@/lib/domain/events";
import { saveResource, saveVenue } from "@/lib/domain/catalog";
import { loadClash } from "./_lib/load";
import { parseResource, parseVenue } from "./_lib/parse";

export type ActionState = { ok?: true; error?: string; fieldErrors?: Record<string, string> };
const GENERIC = "Something went wrong on our side. Please try again in a moment.";
const fail = (e: unknown): ActionState => ({ error: e instanceof DomainError ? e.message : GENERIC });
const refresh = () => { revalidatePath("/admin"); revalidatePath("/admin/approvals", "layout"); revalidatePath("/admin/calendar"); revalidatePath("/admin/catalog"); };

export async function approveAction(eventId: string): Promise<ActionState> {
  const p = await requireRole("admin");
  const actor = { id: p.id, role: p.role };
  try {
    const { event, check } = await loadClash(actor, eventId); // server recomputes; the UI result is advisory
    if (event.status === "pending" && !check.ok) return { error: check.message };
    await reviewEvent(actor, eventId, true);
  } catch (e) { return fail(e); }
  refresh();
  return { ok: true };
}

export async function returnAction(eventId: string, reason: string): Promise<ActionState> {
  const p = await requireRole("admin");
  try { await reviewEvent({ id: p.id, role: p.role }, eventId, false, reason); }
  catch (e) { return fail(e); }
  refresh();
  return { ok: true };
}

export async function saveVenueAction(fields: { id?: string; name: string; capacity: string; location?: string; active: boolean }): Promise<ActionState> {
  const p = await requireRole("admin");
  const v = parseVenue(fields);
  if (!v.ok) return { fieldErrors: v.fieldErrors };
  try { await saveVenue({ id: p.id, role: p.role }, v.value); }
  catch (e) { return fail(e); }
  refresh();
  return { ok: true };
}

export async function saveResourceAction(fields: { id?: string; name: string; total: string; active: boolean }): Promise<ActionState> {
  const p = await requireRole("admin");
  const v = parseResource(fields);
  if (!v.ok) return { fieldErrors: v.fieldErrors };
  try { await saveResource({ id: p.id, role: p.role }, v.value); }
  catch (e) { return fail(e); }
  refresh();
  return { ok: true };
}
