import { describe, expect, it } from "vitest";
import { dayLabel, groupByDay, monthCells, monthTitle, shiftMonth, validMonth } from "@/app/(coordinator)/coordinator/_lib/calendar";

describe("calendar helpers", () => {
  it("month maths", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(monthTitle("2026-02")).toBe("February 2026");
    expect(validMonth("2026-13")).toBe(false);
    expect(validMonth("2026-02")).toBe(true);
  });
  it("cells are Monday-first full weeks", () => {
    const c = monthCells("2026-02"); // 1 Feb 2026 is a Sunday
    expect(c.length % 7).toBe(0);
    expect(c.indexOf("2026-02-01")).toBe(6);
    expect(c.filter(Boolean)).toHaveLength(28);
  });
  it("labels and grouping use the display zone", () => {
    expect(dayLabel("2026-02-20", 2)).toBe("Fri 20 February, 2 events");
    expect(dayLabel("2026-02-20", 1)).toBe("Fri 20 February, 1 event");
    // 20:00Z on 28 Feb is 01:30 on 1 Mar in Asia/Kolkata
    const g = groupByDay([{ starts_at: "2026-02-28T20:00:00.000Z" }, { starts_at: null }, { starts_at: "2026-02-10T04:00:00.000Z" }], "2026-03");
    expect([...g.keys()]).toEqual(["2026-03-01"]);
  });
});
