// tests/xcut/alerts.test.ts — pure unit tests for lib/domain/alerts.ts
// No DB needed — inputs are plain literal objects.

import { describe, expect, it } from "vitest";
import { computeAlerts, splitAlerts, type AlertItem, type AlertKind } from "@/lib/domain/alerts";
import type { EventView } from "@/lib/domain/views";
import type { TaskRow } from "@/lib/domain/allocations";
import type { BookingRow } from "@/lib/domain/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date("2030-06-01T12:00:00.000Z");

function hrefFor(kind: AlertKind, eventId: string) {
  return `/${kind}/${eventId}`;
}

function mkEvent(overrides: Partial<EventView> = {}): EventView {
  return {
    id: "e1",
    title: "Test Event",
    type: "workshop",
    description: null,
    coordinator_id: "c1",
    venue_id: "v1",
    starts_at: new Date(NOW.getTime() + 3 * 86_400_000).toISOString(), // 3 days from now
    ends_at: new Date(NOW.getTime() + 3 * 86_400_000 + 7_200_000).toISOString(),
    capacity: 40,
    status: "open",
    department: null,
    return_reason: null,
    cancel_reason: null,
    venue_name: "Test Hall",
    venue_location: "Block A",
    venue_capacity: 40,
    coordinator_name: "Coord",
    confirmed: 1,
    waitlisted: 0,
    my_reg: null,
    my_waitlist_pos: null,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...overrides,
  };
}

function mkTask(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "t1",
    event_id: "e1",
    event_title: "Test Event",
    title: "Do something",
    assignee_id: "s1",
    assignee_name: "Student",
    due_at: new Date(NOW.getTime() - 86_400_000).toISOString(), // yesterday = overdue
    status: "todo",
    completed_at: null,
    ...overrides,
  };
}

function mkBooking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    event_id: "e1",
    title: "Test Event",
    status: "open",
    department: null,
    venue_id: "v1",
    venue_name: "Test Hall",
    venue_active: 1,
    starts_at: new Date(NOW.getTime() + 3 * 86_400_000).toISOString(),
    ends_at: new Date(NOW.getTime() + 3 * 86_400_000 + 7_200_000).toISOString(),
    conflict: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// splitAlerts
// ---------------------------------------------------------------------------
describe("splitAlerts", () => {
  const items: AlertItem[] = Array.from({ length: 7 }, (_, i) => ({
    kind: "overdue" as const,
    key: `k${i}`,
    text: `Item ${i}`,
    href: `/x/${i}`,
  }));

  it("7 items, limit 5 → shown=5, rest=2 in order", () => {
    const { shown, rest } = splitAlerts(items, 5);
    expect(shown).toHaveLength(5);
    expect(rest).toHaveLength(2);
    expect(shown[0].key).toBe("k0");
    expect(rest[0].key).toBe("k5");
    expect(rest[1].key).toBe("k6");
  });

  it("3 items, limit 5 → rest is empty", () => {
    const { shown, rest } = splitAlerts(items.slice(0, 3), 5);
    expect(shown).toHaveLength(3);
    expect(rest).toHaveLength(0);
  });

  it("limit 0 is treated as 5", () => {
    const { shown } = splitAlerts(items, 0);
    expect(shown).toHaveLength(5);
  });

  it("negative limit is treated as 5", () => {
    const { shown } = splitAlerts(items, -3);
    expect(shown).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// computeAlerts — empty inputs
// ---------------------------------------------------------------------------
describe("computeAlerts — empty inputs", () => {
  it("returns [] for empty events, tasks, bookings", () => {
    const result = computeAlerts({
      role: "admin",
      events: [],
      tasks: [],
      bookings: [],
      now: NOW,
      hrefFor,
    });
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeAlerts — lowreg
// ---------------------------------------------------------------------------
describe("computeAlerts — lowreg", () => {
  it("open event 3 days out with 1 of 40 confirmed produces one lowreg item", () => {
    // isLowReg fires when: status=open, <25% of capacity, within 7 days
    const ev = mkEvent({ capacity: 40, confirmed: 1, status: "open" });
    const result = computeAlerts({
      role: "admin",
      events: [ev],
      tasks: [],
      now: NOW,
      hrefFor,
    });
    const lowregs = result.filter((a) => a.kind === "lowreg");
    expect(lowregs).toHaveLength(1);
    expect(lowregs[0].text).toContain("Test Event");
    expect(lowregs[0].text).toContain("low registrations");
  });

  it("student never receives lowreg", () => {
    const ev = mkEvent({ capacity: 40, confirmed: 1, status: "open" });
    const result = computeAlerts({
      role: "student",
      events: [ev],
      tasks: [],
      now: NOW,
      hrefFor,
    });
    expect(result.filter((a) => a.kind === "lowreg")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// computeAlerts — overdue (grouped per event)
// ---------------------------------------------------------------------------
describe("computeAlerts — overdue", () => {
  it("two overdue tasks on one event produce ONE overdue item", () => {
    const t1 = mkTask({ id: "t1", event_id: "e1", event_title: "Big Event" });
    const t2 = mkTask({ id: "t2", event_id: "e1", event_title: "Big Event" });
    const result = computeAlerts({
      role: "admin",
      events: [mkEvent({ id: "e1" })],
      tasks: [t1, t2],
      now: NOW,
      hrefFor,
    });
    const overdues = result.filter((a) => a.kind === "overdue");
    expect(overdues).toHaveLength(1);
    expect(overdues[0].text).toMatch(/2 tasks are overdue/);
  });

  it("one overdue task produces singular text", () => {
    const result = computeAlerts({
      role: "coordinator",
      events: [mkEvent()],
      tasks: [mkTask()],
      now: NOW,
      hrefFor,
    });
    const overdues = result.filter((a) => a.kind === "overdue");
    expect(overdues).toHaveLength(1);
    expect(overdues[0].text).toMatch(/^1 task is overdue/);
  });

  it("student receives overdue for tasks passed in", () => {
    const result = computeAlerts({
      role: "student",
      events: [],
      tasks: [mkTask()],
      now: NOW,
      hrefFor,
    });
    expect(result.filter((a) => a.kind === "overdue")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// computeAlerts — clash
// ---------------------------------------------------------------------------
describe("computeAlerts — clash", () => {
  it("booking with conflict text produces a clash item for admin", () => {
    const booking = mkBooking({ conflict: 'Overlaps "Other Event" at Test Hall.' });
    const result = computeAlerts({
      role: "admin",
      events: [mkEvent()],
      tasks: [],
      bookings: [booking],
      now: NOW,
      hrefFor,
    });
    const clashes = result.filter((a) => a.kind === "clash");
    expect(clashes).toHaveLength(1);
    expect(clashes[0].text).toContain("Overlaps");
  });

  it("coordinator sees clash only for own events", () => {
    const ownBooking = mkBooking({
      event_id: "e-own",
      conflict: "Clash on own event",
    });
    const otherBooking = mkBooking({
      event_id: "e-other",
      conflict: "Clash on other coord's event",
    });
    const ownEvent = mkEvent({ id: "e-own" });
    const result = computeAlerts({
      role: "coordinator",
      events: [ownEvent],
      tasks: [],
      bookings: [ownBooking, otherBooking],
      now: NOW,
      hrefFor,
    });
    const clashes = result.filter((a) => a.kind === "clash");
    expect(clashes).toHaveLength(1);
    expect(clashes[0].text).toContain("Clash on own event");
  });

  it("student never receives clash", () => {
    const booking = mkBooking({ conflict: "Some clash" });
    const result = computeAlerts({
      role: "student",
      events: [],
      tasks: [],
      bookings: [booking],
      now: NOW,
      hrefFor,
    });
    expect(result.filter((a) => a.kind === "clash")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// computeAlerts — ordering
// ---------------------------------------------------------------------------
describe("computeAlerts — ordering", () => {
  it("order is clash → overdue → lowreg, stable by key", () => {
    const ev = mkEvent({ capacity: 40, confirmed: 1, status: "open" }); // triggers lowreg
    const task = mkTask(); // triggers overdue
    const booking = mkBooking({ conflict: "A clash" }); // triggers clash

    const result = computeAlerts({
      role: "admin",
      events: [ev],
      tasks: [task],
      bookings: [booking],
      now: NOW,
      hrefFor,
    });

    expect(result.length).toBeGreaterThanOrEqual(3);
    const kinds = result.map((a) => a.kind);
    const clashIdx = kinds.indexOf("clash");
    const overdueIdx = kinds.indexOf("overdue");
    const lowregIdx = kinds.indexOf("lowreg");
    expect(clashIdx).toBeLessThan(overdueIdx);
    expect(overdueIdx).toBeLessThan(lowregIdx);
  });
});
