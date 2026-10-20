import { describe, expect, it } from "vitest";
import { parseResource, parseVenue } from "@/app/(admin)/admin/_lib/parse";

describe("catalog parsing", () => {
  it("venue errors use the specified copy", () => {
    const r = parseVenue({ name: " ", capacity: "0" });
    expect(r).toEqual({ ok: false, fieldErrors: { name: "Enter a name for the venue.", capacity: "Enter the capacity as a whole number, at least 1." } });
    expect(parseVenue({ name: "A", capacity: "2.5" }).ok).toBe(false);
  });
  it("venue ok", () => {
    expect(parseVenue({ name: " Hall ", capacity: "40", location: "", active: true })).toEqual({ ok: true, value: { id: undefined, name: "Hall", capacity: 40, location: null, active: true } });
  });
  it("resource errors", () => {
    const r = parseResource({ name: "", total: "-1" });
    expect(r.ok).toBe(false);
    expect(parseResource({ name: "Mic", total: "3", active: false })).toMatchObject({ ok: true, value: { quantity: 3, active: false } });
  });
});
