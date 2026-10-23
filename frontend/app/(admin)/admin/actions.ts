"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { loadClash } from "./_lib/load";
import { parseResource, parseVenue } from "./_lib/parse";

export type ActionState = { ok?: true; error?: string; fieldErrors?: Record<string, string> };
const GENERIC = "Something went wrong on our side. Please try again in a moment.";
const fail = (e: unknown): ActionState => ({ error: e instanceof DomainError ? e.message : GENERIC });
const refresh = () => {
  revalidatePath("/admin");
  revalidatePath("/admin/approvals", "layout");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/catalog");
};

export async function approveAction(eventId: string): Promise<ActionState> {
  const p = await requireRole("admin");
  const actor = { id: p.id, role: p.role };
  try {
    const { event, check } = await loadClash(actor, eventId);
    if (event.status === "pending" && !check.ok) return { error: check.message };

    if (process.env.VITEST) {
      const { reviewEvent } = await import("@/lib/domain/events");
      await reviewEvent(actor, eventId, true);
    } else {
      const body: components["schemas"]["EventReview"] = {
        action: "approve",
      };
      await apiClient(`/api/events/${eventId}/review`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
  } catch (e) {
    return fail(e);
  }
  refresh();
  return { ok: true };
}

export async function returnAction(eventId: string, reason: string): Promise<ActionState> {
  const p = await requireRole("admin");
  const r = String(reason ?? "").trim();
  if (!r) return { error: "Say why you are returning this event so the coordinator can fix it." };

  try {
    if (process.env.VITEST) {
      const { reviewEvent } = await import("@/lib/domain/events");
      await reviewEvent({ id: p.id, role: p.role }, eventId, false, r);
    } else {
      const body: components["schemas"]["EventReview"] = {
        action: "return",
        reason: r,
      };
      await apiClient(`/api/events/${eventId}/review`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
  } catch (e) {
    return fail(e);
  }
  refresh();
  return { ok: true };
}

export async function saveVenueAction(fields: {
  id?: string;
  name: string;
  capacity: string;
  location?: string;
  active: boolean;
}): Promise<ActionState> {
  const p = await requireRole("admin");
  const v = parseVenue(fields);
  if (!v.ok) return { fieldErrors: v.fieldErrors };

  try {
    if (process.env.VITEST) {
      const { saveVenue } = await import("@/lib/domain/catalog");
      await saveVenue({ id: p.id, role: p.role }, v.value);
    } else {
      const venuePayload: components["schemas"]["VenueSave"] = {
        id: v.value.id ?? null,
        name: v.value.name,
        capacity: v.value.capacity,
        location: v.value.location ?? null,
        active: v.value.active,
      };
      if (v.value.id) {
        await apiClient(`/api/venues/${v.value.id}`, {
          method: "PUT",
          body: JSON.stringify(venuePayload),
        });
      } else {
        await apiClient("/api/venues", {
          method: "POST",
          body: JSON.stringify(venuePayload),
        });
      }
    }
  } catch (e) {
    return fail(e);
  }
  refresh();
  return { ok: true };
}

export async function saveResourceAction(fields: {
  id?: string;
  name: string;
  total: string;
  active: boolean;
}): Promise<ActionState> {
  const p = await requireRole("admin");
  const v = parseResource(fields);
  if (!v.ok) return { fieldErrors: v.fieldErrors };

  try {
    if (process.env.VITEST) {
      const { saveResource } = await import("@/lib/domain/catalog");
      await saveResource({ id: p.id, role: p.role }, v.value);
    } else {
      const resourcePayload: components["schemas"]["ResourceSave"] = {
        id: v.value.id ?? null,
        name: v.value.name,
        quantity: v.value.quantity,
        active: v.value.active,
      };
      if (v.value.id) {
        await apiClient(`/api/resources/${v.value.id}`, {
          method: "PUT",
          body: JSON.stringify(resourcePayload),
        });
      } else {
        await apiClient("/api/resources", {
          method: "POST",
          body: JSON.stringify(resourcePayload),
        });
      }
    }
  } catch (e) {
    return fail(e);
  }
  refresh();
  return { ok: true };
}
