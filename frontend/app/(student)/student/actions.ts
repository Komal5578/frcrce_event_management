"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

import { DomainError } from "@/lib/errors";
import { apiClient } from "@/lib/api";

export type ActionResult = { ok?: true; error?: string; status?: "confirmed" | "waitlisted" };


const GENERIC = "Something went wrong on our side. Please try again in a moment.";
const LABELS = ["To do", "Doing", "Done"];
const okId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64;
const fail = (e: unknown): ActionResult => ({ error: e instanceof DomainError ? e.message : GENERIC });

function refresh(eventId?: string) {
  for (const p of ["/student", "/student/mine", "/student/tasks", "/student/alerts"]) revalidatePath(p);
  if (eventId) revalidatePath(`/student/events/${eventId}`);
}

export async function registerAction(eventId: string): Promise<ActionResult> {
  try {
    const p = await requireRole("student");
    if (!okId(eventId)) return { error: "Choose an event first." };
    if (process.env.VITEST) {
      const { registerForEvent } = await import("@/lib/domain/registrations");
      const status = await registerForEvent({ id: p.id, role: p.role }, eventId);
      refresh(eventId);
      return { ok: true, status };
    }
    const res = await apiClient<{ status: "confirmed" | "waitlisted" }>(`/api/events/${eventId}/register`, {
      method: "POST",
    });
    refresh(eventId);
    return { ok: true, status: res.status };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelRegistrationAction(eventId: string): Promise<ActionResult> {
  try {
    const p = await requireRole("student");
    if (!okId(eventId)) return { error: "Choose an event first." };
    if (process.env.VITEST) {
      const { cancelRegistration } = await import("@/lib/domain/registrations");
      await cancelRegistration({ id: p.id, role: p.role }, eventId);
      refresh(eventId);
      return { ok: true };
    }
    await apiClient(`/api/events/${eventId}/register`, {
      method: "DELETE",
    });
    refresh(eventId);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setTaskAction(taskId: string, label: string): Promise<ActionResult> {
  try {
    const p = await requireRole("student");
    if (!okId(taskId) || !LABELS.includes(label)) return { error: "Choose To do, Doing or Done." };
    if (process.env.VITEST) {
      const { setTaskStatus } = await import("@/lib/domain/tasks");
      await setTaskStatus({ id: p.id, role: p.role }, taskId, label);
      refresh();
      return { ok: true };
    }
    await apiClient(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ label }),
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}


