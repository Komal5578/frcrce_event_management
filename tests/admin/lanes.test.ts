import { describe, expect, it } from "vitest";
import { agendaGroups, lanes, noConflicts, weekColumns } from "@/app/(admin)/admin/_lib/lanes";

const b = (id: string, v: string, starts: string, conflict: string | null = null) => ({ event_id: id, venue_id: v, starts_at: starts, conflict });
describe("lanes", () => {
  it("weekColumns gives 7 Monday-first days", () => {
    const w = weekColumns("2026-03-01", 0); // 1 Mar 2026 is a Sunday
    expect(w[0]).toBe("2026-02-23");
    expect(w[6]).toBe("2026-03-01");
    expect(weekColumns("2026-03-01", 1)[0]).toBe("2026-03-02");
  });
  it("groups by venue and start day; empty month is empty", () => {
    const g = lanes([b("1", "v1", "2026-03-02T05:00:00.000Z"), b("2", "v1", "2026-03-02T09:00:00.000Z"), b("3", "v2", "2026-03-03T05:00:00.000Z")]);
    expect(g.get("v1")!.get("2026-03-02")).toHaveLength(2);
    expect(g.get("v2")!.get("2026-03-03")).toHaveLength(1);
    expect(lanes([]).size).toBe(0);
    expect(agendaGroups([])).toEqual([]);
  });
  it("agenda groups sorted by day", () => {
    const a = agendaGroups([b("2", "v", "2026-03-05T05:00:00.000Z"), b("1", "v", "2026-03-02T05:00:00.000Z")]);
    expect(a.map((x) => x.day)).toEqual(["2026-03-02", "2026-03-05"]);
  });
  it("noConflicts iff no conflict string", () => {
    expect(noConflicts([b("1", "v", "2026-03-02T05:00:00.000Z")])).toBe(true);
    expect(noConflicts([b("1", "v", "2026-03-02T05:00:00.000Z", "Overlaps")])).toBe(false);
  });
});
