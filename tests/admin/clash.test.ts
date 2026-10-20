import { describe, expect, it } from "vitest";
import { clashCheck } from "@/app/(admin)/admin/_lib/clash";

const base = { venueName: "Seminar Hall A", venueFree: true, capacity: 120, seats: 100, resources: [] };
describe("clashCheck", () => {
  it("passes with the exact sentence", () => {
    const r = clashCheck(base);
    expect(r.ok).toBe(true);
    expect(r.message).toBe("No clash. Seminar Hall A is free for this time and seats 100 fit its capacity 120.");
  });
  it("names resource shortfall and seats over capacity verbatim", () => {
    const r = clashCheck({ ...base, seats: 130, resources: [{ name: "Projectors", asked: 2, free: 1 }, { name: "Chairs", asked: 5, free: 9 }] });
    expect(r.ok).toBe(false);
    expect(r.failures).toEqual(["Seats 130 exceed capacity 120.", "Not enough Projectors are free for this time: 1 free, 2 requested."]);
  });
  it("a free venue never yields a venue failure", () => {
    expect(clashCheck(base).failures.some((f) => /not available/.test(f))).toBe(false);
  });
});
