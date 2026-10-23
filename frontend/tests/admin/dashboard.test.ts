import { describe, expect, it } from "vitest";
import { stats } from "@/app/(admin)/admin/_lib/dashboard";

const now = new Date("2026-03-10T06:00:00.000Z"); // March: 31 days, 372 bookable hours per venue
const ev = (o: object) => ({ id: "x", title: "T", status: "approved", venue_id: "v1", starts_at: "2026-03-12T05:00:00.000Z", ends_at: "2026-03-12T08:00:00.000Z", department: "CS", capacity: 100, confirmed: 0, ...o });
const venues = [{ id: "v1", name: "Hall", active: 1 }, { id: "v2", name: "Lab", active: 1 }];

describe("dashboard stats", () => {
  const s = stats([
    ev({ id: "a" }), ev({ id: "b", status: "pending", department: "ME", starts_at: "2026-03-13T05:00:00.000Z", ends_at: "2026-03-13T07:00:00.000Z" }),
    ev({ id: "c", status: "cancelled" }), ev({ id: "d", starts_at: "2026-04-02T05:00:00.000Z", ends_at: "2026-04-02T06:00:00.000Z" }),
    ev({ id: "e", status: "open", title: "Photo Walk", capacity: 100, confirmed: 2, starts_at: "2026-03-12T05:00:00.000Z", ends_at: "2026-03-12T06:00:00.000Z", venue_id: "v2" }),
  ], venues, [{ due_at: "2026-03-01T00:00:00.000Z", status: "todo" }, { due_at: "2026-03-01T00:00:00.000Z", status: "done" }], now);
  it("counts", () => {
    expect(s.pendingCount).toBe(1);
    expect(s.eventsThisMonth).toBe(3);
    expect(s.openCount).toBe(1);
    expect(s.overdueCount).toBe(1);
    expect(s.lowReg).toEqual([{ id: "e", title: "Photo Walk" }]);
  });
  it("venue bars sorted descending with text", () => {
    expect(s.venues[0]).toMatchObject({ label: "Hall", text: "1%", detail: "5 of 372 hours" });
    expect(s.venues[1].label).toBe("Lab");
    expect(s.overallPct).toBe(1);
  });
  it("departments sorted descending", () => {
    expect(s.departments.map((d) => [d.label, d.value])).toEqual([["CS", 2], ["ME", 1]]);
  });
});
