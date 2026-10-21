// No DB access, clock-free (no system clock read). Inputs are already actor-scoped from the server.

import { isLowReg, isOverdue } from "./rules";
import type { EventView } from "./views";
import type { TaskRow } from "./allocations";
import type { BookingRow } from "./admin";
import type { Role } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertKind = "clash" | "overdue" | "lowreg";

export type AlertItem = {
  kind: AlertKind;
  key: string;
  text: string;
  href: string;
};

// Severity order for sorting: clash first, then overdue, then lowreg.
export const severityOrder: Record<AlertKind, number> = {
  clash: 0,
  overdue: 1,
  lowreg: 2,
};

// ---------------------------------------------------------------------------
// splitAlerts — the cap rule, unit-testable without a DOM.
// ---------------------------------------------------------------------------

export function splitAlerts<T>(items: T[], limit = 5): { shown: T[]; rest: T[] } {
  // Treat zero or negative limit as 5 (locked default).
  const cap = limit > 0 ? limit : 5;
  return {
    shown: items.slice(0, cap),
    rest: items.slice(cap),
  };
}

// ---------------------------------------------------------------------------
// computeAlerts — pure function, no side effects.
// ---------------------------------------------------------------------------

export type ComputeAlertsInput = {
  role: Role;
  events: EventView[];
  tasks: TaskRow[];
  bookings?: BookingRow[];
  now: Date;
  hrefFor: (kind: AlertKind, eventId: string) => string;
};

export function computeAlerts(input: ComputeAlertsInput): AlertItem[] {
  const { role, events, tasks, bookings = [], now, hrefFor } = input;

  const items: AlertItem[] = [];

  // Build a set of event ids this actor can see (defence in depth for role filter).
  const ownEventIds = new Set(events.map((e) => e.id));

  // ------------------------------------------------------------------
  // Clash alerts (admin: all bookings with conflict; coordinator: own events only)
  // Students never receive clash alerts.
  // ------------------------------------------------------------------
  if (role === "admin" || role === "coordinator") {
    for (const booking of bookings) {
      if (!booking.conflict) continue;
      // Coordinator only sees clash for events they own.
      if (role === "coordinator" && !ownEventIds.has(booking.event_id)) continue;
      items.push({
        kind: "clash",
        key: `clash-${booking.event_id}`,
        text: booking.conflict,
        href: hrefFor("clash", booking.event_id),
      });
    }
  }

  // ------------------------------------------------------------------
  // Overdue task alerts — grouped per event_id.
  // All roles can receive overdue (students receive only their own tasks,
  // but the caller is responsible for scoping the input tasks array).
  // ------------------------------------------------------------------
  const overdueByEvent = new Map<string, { count: number; title: string }>();
  for (const task of tasks) {
    if (!isOverdue(task, now)) continue;
    const current = overdueByEvent.get(task.event_id);
    if (current) {
      current.count++;
    } else {
      overdueByEvent.set(task.event_id, { count: 1, title: task.event_title });
    }
  }
  for (const [eventId, { count, title }] of overdueByEvent) {
    const text =
      count === 1
        ? `1 task is overdue on ${title}`
        : `${count} tasks are overdue on ${title}`;
    items.push({
      kind: "overdue",
      key: `overdue-${eventId}`,
      text,
      href: hrefFor("overdue", eventId),
    });
  }

  // ------------------------------------------------------------------
  // Low-registration alerts (admin and coordinator only; not students).
  // ------------------------------------------------------------------
  if (role === "admin" || role === "coordinator") {
    for (const ev of events) {
      if (!isLowReg(ev, now)) continue;
      // Coordinator: only for their own events (already filtered by input, but defence in depth).
      if (role === "coordinator" && !ownEventIds.has(ev.id)) continue;
      items.push({
        kind: "lowreg",
        key: `lowreg-${ev.id}`,
        text: `${ev.title} has low registrations`,
        href: hrefFor("lowreg", ev.id),
      });
    }
  }

  // ------------------------------------------------------------------
  // Sort: clash → overdue → lowreg, stable by key within each kind.
  // ------------------------------------------------------------------
  items.sort((a, b) => {
    const kindDiff = severityOrder[a.kind] - severityOrder[b.kind];
    if (kindDiff !== 0) return kindDiff;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  return items;
}
