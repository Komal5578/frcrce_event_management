// tests/xcut/reports.test.ts — tests for lib/domain/reports.ts
// Pattern: d1Shim + freshDb, actor ids from seed.sql

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "../helpers/sqlite";

let db: DatabaseSync;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));

const COORD = { id: "a0000000-0000-0000-0000-000000000001", role: "coordinator" as const };
const COORD2 = { id: "a0000000-0000-0000-0000-000000000002", role: "coordinator" as const };
const ADMIN = { id: "a0000000-0000-0000-0000-000000000003", role: "admin" as const };
const S1 = { id: "a0000000-0000-0000-0000-000000000004", role: "student" as const };
const VENUE = "b0000000-0000-0000-0000-000000000005";

/** Seed the minimum rows needed (profiles + one venue) so FK constraints pass. */
function seedActors() {
  const ins = (id: string, role: string, name: string) =>
    db.prepare("INSERT INTO profiles (id, email, password_hash, name, role) VALUES (?,?,?,?,?)").run(
      id, `${id}@test.local`, "x", name, role,
    );
  ins(COORD.id, "coordinator", "Priya");
  ins(COORD2.id, "coordinator", "Rahul");
  ins(ADMIN.id, "admin", "Admin");
  ins(S1.id, "student", "Student");
  db.prepare("INSERT INTO venues (id, name, capacity, location, active) VALUES (?,?,?,?,?)").run(
    VENUE, "Test Hall", 100, "Test Block", 1,
  );
}

let eventCounter = 0;
function mkEvent(
  id: string,
  status: string,
  coordinatorId = COORD.id,
  title = `Event ${id}`,
  capacity = 30,
  start?: string,
  end?: string,
) {
  // Each event gets a unique slot 2 hours apart to avoid the venue-clash trigger.
  const offset = ++eventCounter;
  const s = start ?? `2031-01-${String(offset).padStart(2, "0")}T10:00:00.000Z`;
  const e = end ?? `2031-01-${String(offset).padStart(2, "0")}T12:00:00.000Z`;
  db.prepare(
    "INSERT INTO events (id,title,coordinator_id,venue_id,starts_at,ends_at,capacity,status) VALUES (?,?,?,?,?,?,?,?)",
  ).run(id, title, coordinatorId, VENUE, s, e, capacity, status);
}

function mkTask(
  id: string,
  eventId: string,
  status: string,
  dueAt: string | null,
  assigneeId = S1.id,
) {
  db.prepare(
    "INSERT INTO tasks (id, event_id, title, assignee_id, due_at, status) VALUES (?,?,?,?,?,?)",
  ).run(id, eventId, `Task ${id}`, assigneeId, dueAt, status);
}

// Inline RFC 4180 parser (NOT from production code — local to this file only).
function parseCsv(raw: string): string[][] {
  const src = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] === '"') {
      i++;
      let val = "";
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') { val += '"'; i += 2; }
          else { i++; break; }
        } else { val += src[i++]; }
      }
      row.push(val);
      if (src[i] === ",") i++;
    } else if (src[i] === "\r" && src[i + 1] === "\n") {
      rows.push(row); row = []; i += 2;
    } else if (src[i] === "\n") {
      rows.push(row); row = []; i++;
    } else {
      let val = "";
      while (i < src.length && src[i] !== "," && src[i] !== "\r" && src[i] !== "\n") val += src[i++];
      row.push(val);
      if (src[i] === ",") i++;
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

const code = async (p: Promise<unknown>) =>
  p.then(() => null, (e) => (e as { code?: string }).code ?? "RAW");

beforeEach(() => { eventCounter = 0; db = freshDb({ seed: false }); seedActors(); });

// ---------------------------------------------------------------------------
// parseFilters
// ---------------------------------------------------------------------------
describe("parseFilters", () => {
  it("allows valid status keys", async () => {
    const { parseFilters } = await import("@/lib/domain/reports");
    expect(parseFilters({ status: "open" })).toEqual({ status: "open" });
    expect(parseFilters({ status: "draft" })).toEqual({ status: "draft" });
  });

  it("drops invalid status keys", async () => {
    const { parseFilters } = await import("@/lib/domain/reports");
    expect(parseFilters({ status: "injected'; DROP" })).toEqual({});
    expect(parseFilters({ status: "" })).toEqual({});
  });

  it("allows valid ISO dates for from/to", async () => {
    const { parseFilters } = await import("@/lib/domain/reports");
    expect(parseFilters({ from: "2026-01-01", to: "2026-12-31" })).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("drops malformed dates", async () => {
    const { parseFilters } = await import("@/lib/domain/reports");
    expect(parseFilters({ from: "01-01-2026" })).toEqual({});
    expect(parseFilters({ from: "2026-1-1" })).toEqual({});
    expect(parseFilters({ from: "'; SELECT" })).toEqual({});
  });

  it("unknown keys are silently dropped", async () => {
    const { parseFilters } = await import("@/lib/domain/reports");
    expect(parseFilters({ evil: "x", status: "open" })).toEqual({ status: "open" });
  });
});

// ---------------------------------------------------------------------------
// buildReport — access control
// ---------------------------------------------------------------------------
describe("buildReport — access control", () => {
  it("rejects student with NOT_ALLOWED", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    expect(await code(buildReport(S1, {}, new Date()))).toBe("NOT_ALLOWED");
  });

  it("allows coordinator", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-c1", "open");
    const result = await buildReport(COORD, {}, new Date());
    expect(result.columns.length).toBeGreaterThan(0);
  });

  it("allows admin", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-a1", "open");
    const result = await buildReport(ADMIN, {}, new Date());
    expect(result.columns.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildReport — role scoping
// ---------------------------------------------------------------------------
describe("buildReport — role scoping", () => {
  it("coordinator B sees none of coordinator A's events", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-coord1", "open", COORD.id, "Coord A Event");
    mkEvent("e-coord2", "open", COORD2.id, "Coord B Event");

    const resultA = await buildReport(COORD, {}, new Date());
    const resultB = await buildReport(COORD2, {}, new Date());

    const titlesA = resultA.rows.map((r) => r.title);
    const titlesB = resultB.rows.map((r) => r.title);

    expect(titlesA).toContain("Coord A Event");
    expect(titlesA).not.toContain("Coord B Event");
    expect(titlesB).toContain("Coord B Event");
    expect(titlesB).not.toContain("Coord A Event");
  });

  it("admin sees events from all coordinators", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-m1", "open", COORD.id, "Event from Coord A");
    mkEvent("e-m2", "open", COORD2.id, "Event from Coord B");

    const result = await buildReport(ADMIN, {}, new Date());
    const titles = result.rows.map((r) => r.title);
    expect(titles).toContain("Event from Coord A");
    expect(titles).toContain("Event from Coord B");
  });
});

// ---------------------------------------------------------------------------
// buildReport — columns contain no PII
// ---------------------------------------------------------------------------
describe("buildReport — no PII in columns", () => {
  it("no column key contains 'name', 'email', or 'registrant'", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    const result = await buildReport(COORD, {}, new Date());
    const keys = result.columns.map((c) => c.key.toLowerCase());
    for (const key of keys) {
      expect(key).not.toMatch(/name|email|registrant/);
    }
  });

  it("no row key contains 'name', 'email', or 'registrant'", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-pii", "open");
    const result = await buildReport(COORD, {}, new Date());
    for (const row of result.rows) {
      for (const key of Object.keys(row)) {
        expect(key.toLowerCase()).not.toMatch(/name|email|registrant/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// buildReport — totals and determinism
// ---------------------------------------------------------------------------
describe("buildReport — totals and determinism", () => {
  it("totals.events equals rows.length", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-t1", "open");
    mkEvent("e-t2", "open");
    const result = await buildReport(COORD, {}, new Date());
    expect(result.totals.events).toBe(result.rows.length);
  });

  it("same inputs give same rows (determinism)", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    mkEvent("e-d1", "open");
    const now = new Date("2031-01-01T00:00:00.000Z");
    const r1 = await buildReport(COORD, {}, now);
    const r2 = await buildReport(COORD, {}, now);
    expect(r1.rows).toEqual(r2.rows);
  });
});

// ---------------------------------------------------------------------------
// buildReport — CSV round-trip
// ---------------------------------------------------------------------------
describe("buildReport — CSV round-trip", () => {
  it("toCsv(columns, rows) parsed equals rows stringified", async () => {
    const { buildReport } = await import("@/lib/domain/reports");
    const { toCsv } = await import("@/lib/csv");
    mkEvent("e-csv1", "open", COORD.id, "CSV Test Event");
    const result = await buildReport(COORD, {}, new Date());
    const csv = toCsv(result.columns, result.rows);
    const parsed = parseCsv(csv);
    // Row 0 is the header; rows 1+ are data.
    expect(parsed.length).toBe(result.rows.length + 1);
    for (let i = 0; i < result.rows.length; i++) {
      const dataRow = result.rows[i];
      const parsedRow = parsed[i + 1];
      result.columns.forEach((col, colIdx) => {
        const expected = dataRow[col.key] === null || dataRow[col.key] === undefined
          ? ""
          : String(dataRow[col.key]);
        // Strip injection prefix if present.
        const actual = parsedRow[colIdx].startsWith("'")
          ? parsedRow[colIdx].slice(1)
          : parsedRow[colIdx];
        expect(actual).toBe(expected);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// listOverdueTasksForActor
// ---------------------------------------------------------------------------
describe("listOverdueTasksForActor", () => {
  const PAST = "2020-01-01T00:00:00.000Z";
  const FUTURE = "2099-12-31T23:59:59.000Z";
  const NOW = new Date("2030-01-01T00:00:00.000Z");

  it("rejects student with NOT_ALLOWED", async () => {
    const { listOverdueTasksForActor } = await import("@/lib/domain/reports");
    expect(await code(listOverdueTasksForActor(S1, NOW))).toBe("NOT_ALLOWED");
  });

  it("admin sees overdue tasks across all events", async () => {
    const { listOverdueTasksForActor } = await import("@/lib/domain/reports");
    mkEvent("e-ov1", "open", COORD.id);
    mkEvent("e-ov2", "open", COORD2.id);
    mkTask("t-ov1", "e-ov1", "todo", PAST);
    mkTask("t-ov2", "e-ov2", "todo", PAST);
    const tasks = await listOverdueTasksForActor(ADMIN, NOW);
    const ids = tasks.map((t) => t.id);
    expect(ids).toContain("t-ov1");
    expect(ids).toContain("t-ov2");
  });

  it("coordinator sees only tasks on own events", async () => {
    const { listOverdueTasksForActor } = await import("@/lib/domain/reports");
    mkEvent("e-own1", "open", COORD.id);
    mkEvent("e-own2", "open", COORD2.id);
    mkTask("t-own1", "e-own1", "todo", PAST);
    mkTask("t-own2", "e-own2", "todo", PAST);
    const tasks = await listOverdueTasksForActor(COORD, NOW);
    const ids = tasks.map((t) => t.id);
    expect(ids).toContain("t-own1");
    expect(ids).not.toContain("t-own2");
  });

  it("excludes tasks due in the future", async () => {
    const { listOverdueTasksForActor } = await import("@/lib/domain/reports");
    mkEvent("e-fut", "open", COORD.id);
    mkTask("t-fut", "e-fut", "todo", FUTURE);
    const tasks = await listOverdueTasksForActor(COORD, NOW);
    expect(tasks.map((t) => t.id)).not.toContain("t-fut");
  });

  it("excludes tasks already done", async () => {
    const { listOverdueTasksForActor } = await import("@/lib/domain/reports");
    mkEvent("e-done", "open", COORD.id);
    mkTask("t-done", "e-done", "done", PAST);
    const tasks = await listOverdueTasksForActor(COORD, NOW);
    expect(tasks.map((t) => t.id)).not.toContain("t-done");
  });

  it("excludes null due_at", async () => {
    const { listOverdueTasksForActor } = await import("@/lib/domain/reports");
    mkEvent("e-null", "open", COORD.id);
    mkTask("t-null", "e-null", "todo", null);
    const tasks = await listOverdueTasksForActor(COORD, NOW);
    expect(tasks.map((t) => t.id)).not.toContain("t-null");
  });
});
