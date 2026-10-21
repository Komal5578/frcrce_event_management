import type { Role } from "@/lib/auth";
import type { AlertKind } from "@/lib/domain/alerts";

export function alertHref(role: Role, kind: AlertKind, eventId: string): string {
  if (role === "admin") {
    if (kind === "clash") return "/admin/calendar";
    // lowreg and overdue link to the approvals detail if eventId given, else calendar
    return eventId ? `/admin/approvals/${eventId}` : "/admin/calendar";
  }

  if (role === "coordinator") {
    if (kind === "overdue") return eventId ? `/coordinator/${eventId}` : "/coordinator/tasks";
    return `/coordinator/${eventId}`;
  }

  // student
  return "/student/tasks";
}
