import { describe, expect, it } from "vitest";
import { DISPLAY_TZ, dayKey, formatDate, formatDateTime, formatRange, formatShortDate, formatTime, isoToInputs, localToIso, relativeDay } from "@/lib/format";
import { isLowReg, isOverdue } from "@/lib/domain/rules";

describe("format (Asia/Kolkata)", () => {
  it("zone is Kolkata", () => expect(DISPLAY_TZ).toBe("Asia/Kolkata"));
  it("localToIso converts and rejects invalid", () => {
    expect(localToIso("2026-02-20", "17:00")).toBe("2026-02-20T11:30:00.000Z");
    for (const [d, t] of [["2026-02-30", "10:00"], ["2026-02-20", "25:00"], ["", ""], ["2026-02-20", "10:60"], ["20-02-2026", "10:00"]])
      expect(localToIso(d, t)).toBeNull();
  });
  it("formats are human, 24 hour, never ISO", () => {
    const s = "2026-02-20T11:30:00.000Z", e = "2026-02-20T13:00:00.000Z";
    expect(formatDate(s)).toBe("Fri 20 Feb 2026");
    expect(formatShortDate("2026-03-08T05:00:00.000Z")).toBe("08 Mar 2026");
    expect(formatTime(s)).toBe("17:00");
    expect(formatDateTime(s)).toBe("Fri 20 Feb 2026, 17:00");
    expect(formatRange(s, e)).toBe("Fri 20 Feb 2026, 17:00 to 18:30");
    expect(formatRange(s, "2026-02-21T13:00:00.000Z")).toBe("Fri 20 Feb 2026, 17:00 to Sat 21 Feb 2026, 18:30");
  });
  it("isoToInputs round-trips", () => {
    expect(isoToInputs("2026-02-20T11:30:00.000Z")).toEqual({ date: "2026-02-20", time: "17:00" });
    expect(localToIso("2026-07-01", "00:05")).toBe("2026-06-30T18:35:00.000Z");
    const { date, time } = isoToInputs("2026-06-30T18:35:00.000Z");
    expect(localToIso(date, time)).toBe("2026-06-30T18:35:00.000Z");
  });
  it("dayKey groups by local day", () => expect(dayKey("2026-02-19T20:00:00.000Z")).toBe("2026-02-20"));
  it("relativeDay", () => {
    const now = new Date("2026-02-20T06:00:00.000Z");
    expect(relativeDay("2026-02-20T11:30:00.000Z", now)).toBe("Today");
    expect(relativeDay("2026-02-21T11:30:00.000Z", now)).toBe("Tomorrow");
    expect(relativeDay("2026-02-23T11:30:00.000Z", now)).toBeNull();
  });
});

describe("rules", () => {
  const now = new Date("2026-02-20T00:00:00.000Z");
  it("isOverdue", () => {
    expect(isOverdue({ due_at: "2026-02-19T00:00:00.000Z", status: "todo" }, now)).toBe(true);
    expect(isOverdue({ due_at: "2026-02-19T00:00:00.000Z", status: "done" }, now)).toBe(false);
    expect(isOverdue({ due_at: "2026-02-21T00:00:00.000Z", status: "todo" }, now)).toBe(false);
  });
  it("isLowReg", () => {
    const base = { status: "open", capacity: 100, starts_at: "2026-02-24T00:00:00.000Z", confirmed: 10 };
    expect(isLowReg(base, now)).toBe(true);
    expect(isLowReg({ ...base, confirmed: 25 }, now)).toBe(false);
    expect(isLowReg({ ...base, starts_at: "2026-03-10T00:00:00.000Z" }, now)).toBe(false);
    expect(isLowReg({ ...base, status: "approved" }, now)).toBe(false);
  });
});
