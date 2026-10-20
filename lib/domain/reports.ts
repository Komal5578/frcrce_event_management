// lib/domain/reports.ts — Pure report read model for Admin and Coordinator roles.
// No template-literal SQL; all queries use constant strings + bind().

import { getDb } from "@/lib/db";
import { guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";
import { listEventsWithSeats } from "./views";
import { isOverdue } from "./rules";
import type { TaskRow } from "./allocations";
import { STATUS_META, type StatusKey } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportFilters = {
  status?: string;
  from?: string;
  to?: string;
};

export type ReportRow = Record<string, string | number | null>;

export type ReportResult = {
  columns: { key: string; label: string }[];
  rows: ReportRow[];
  totals: { events: number; registered: number };
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Fixed column order — never derived from user input.
const COLUMNS: { key: string; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "starts_at", label: "Date & Time" },
  { key: "venue", label: "Venue" },
  { key: "department", label: "Department" },
  { key: "registered", label: "Registered" },
  { key: "capacity", label: "Capacity" },
  { key: "overdue_tasks", label: "Overdue tasks" },
];

// Whitelisted status keys.
const VALID_STATUS_KEYS = new Set(Object.keys(STATUS_META));

// ISO date pattern YYYY-MM-DD.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// SQL for overdue-task queries — constant strings, no template literals.
const TASKS_ADMIN =
  "SELECT t.id, t.event_id, e.title AS event_title, t.title, t.assignee_id, p.name AS assignee_name, " +
  "t.due_at, t.status, t.completed_at " +
  "FROM tasks t JOIN events e ON e.id = t.event_id LEFT JOIN profiles p ON p.id = t.assignee_id " +
  "WHERE t.status <> 'done' AND t.due_at IS NOT NULL AND t.due_at < ?1 " +
  "ORDER BY t.due_at, t.id";

const TASKS_COORD =
  "SELECT t.id, t.event_id, e.title AS event_title, t.title, t.assignee_id, p.name AS assignee_name, " +
  "t.due_at, t.status, t.completed_at " +
  "FROM tasks t JOIN events e ON e.id = t.event_id LEFT JOIN profiles p ON p.id = t.assignee_id " +
  "WHERE t.status <> 'done' AND t.due_at IS NOT NULL AND t.due_at < ?1 AND e.coordinator_id = ?2 " +
  "ORDER BY t.due_at, t.id";

// ---------------------------------------------------------------------------
// parseFilters — whitelist only; unknown keys are silently dropped.
// ---------------------------------------------------------------------------

export function parseFilters(raw: Record<string, string | undefined>): ReportFilters {
  const out: ReportFilters = {};
  if (raw.status && VALID_STATUS_KEYS.has(raw.status)) {
    out.status = raw.status;
  }
  if (raw.from && ISO_DATE_RE.test(raw.from)) {
    out.from = raw.from;
  }
  if (raw.to && ISO_DATE_RE.test(raw.to)) {
    out.to = raw.to;
  }
  return out;
}

// ---------------------------------------------------------------------------
// listOverdueTasksForActor — used by reports page and alerts page.
// ---------------------------------------------------------------------------

export async function listOverdueTasksForActor(actor: Actor, now: Date): Promise<TaskRow[]> {
  requireActorRole(actor, "coordinator", "admin");
  const nowIso = now.toISOString();
  let raw: TaskRow[];
  if (actor.role === "admin") {
    raw = await guard(async () =>
      (await getDb().prepare(TASKS_ADMIN).bind(nowIso).all<TaskRow>()).results,
    );
  } else {
    // coordinator
    raw = await guard(async () =>
      (await getDb().prepare(TASKS_COORD).bind(nowIso, actor.id).all<TaskRow>()).results,
    );
  }
  // Final defence: filter through the shared isOverdue rule.
  return raw.filter((t) => isOverdue(t, now));
}

// ---------------------------------------------------------------------------
// buildReport — the single read model for both page and CSV.
// ---------------------------------------------------------------------------

export async function buildReport(
  actor: Actor,
  rawFilters: Record<string, string | undefined>,
  now: Date,
): Promise<ReportResult> {
  // Students are never allowed (XCUT-01 locked decision).
  requireActorRole(actor, "coordinator", "admin");

  const filters = parseFilters(rawFilters);

  // Role-scoped events (coordinator sees only their own events via listEventsWithSeats).
  let events = await listEventsWithSeats(actor);

  // Apply whitelisted filters.
  if (filters.status) {
    events = events.filter((e) => e.status === filters.status);
  }
  if (filters.from) {
    events = events.filter((e) => e.starts_at >= filters.from! + "T00:00:00.000Z");
  }
  if (filters.to) {
    events = events.filter((e) => e.starts_at <= filters.to! + "T23:59:59.999Z");
  }

  // Get overdue tasks to compute per-event counts.
  const overdueTasks = await listOverdueTasksForActor(actor, now);
  const overdueByEvent = new Map<string, number>();
  for (const t of overdueTasks) {
    overdueByEvent.set(t.event_id, (overdueByEvent.get(t.event_id) ?? 0) + 1);
  }

  // Build rows — counts only, no registrant identities.
  const rows: ReportRow[] = events.map((e) => ({
    title: e.title,
    status: STATUS_META[e.status as StatusKey]?.label ?? e.status,
    starts_at: e.starts_at ? formatDateTime(e.starts_at) : null,
    venue: e.venue_name ?? null,
    department: e.department ?? null,
    registered: e.confirmed,
    capacity: e.venue_capacity ?? null,
    overdue_tasks: overdueByEvent.get(e.id) ?? 0,
  }));

  const totals = {
    events: rows.length,
    registered: rows.reduce((s, r) => s + (typeof r.registered === "number" ? r.registered : 0), 0),
  };

  return {
    columns: COLUMNS,
    rows,
    totals,
    generatedAt: now.toISOString(),
  };
}
