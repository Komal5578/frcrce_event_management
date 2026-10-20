import { describe, expect, it } from "vitest";
import { venueGroups, venueState } from "@/app/(coordinator)/coordinator/_lib/venues";

const V = [
  { id: "a", name: "Seminar Hall", capacity: 120, active: 1 },
  { id: "b", name: "Room 204", capacity: 40, active: 1 },
  { id: "c", name: "Old Lab", capacity: 80, active: 0 },
  { id: "d", name: "Auditorium", capacity: 400, active: 1 },
];
const busy = [{ venue_id: "d", event_title: "Annual Day", starts_at: "2026-03-12T03:30:00.000Z", ends_at: "2026-03-12T07:30:00.000Z" }];

describe("venueGroups", () => {
  const g = venueGroups(V, new Set(["a", "b", "c"]), busy, 60);
  it("lists free venues that fit, with a fit sentence", () => {
    expect(g.free).toEqual([{ id: "a", name: "Seminar Hall", capacity: 120, fits: "fits your 60 seats" }]);
  });
  it("keeps every other venue with a plain reason, never hidden", () => {
    const r = Object.fromEntries(g.unavailable.map((u) => [u.id, u]));
    expect(r.b.reason).toBe("Capacity 40 is below your 60 seats");
    expect(r.c.reason).toBe("Not in use");
    expect(r.d.reason).toBe("Booked by Annual Day, 09:00 to 13:00");
    expect(r.d.clash).toBe(true);
    expect(g.free.length + g.unavailable.length).toBe(V.length);
  });
  it("summary state is text", () => {
    expect(venueState("a", V, new Set(["a"]), [], 60)).toMatchObject({ ok: true });
    expect(venueState("d", V, new Set(), busy, 60).text).toMatch(/Booked by Annual Day/);
    expect(venueState(null, V, null, [], 60).text).toBe("Not chosen");
  });
});

import { ago, monitorModel } from "@/app/(coordinator)/coordinator/_lib/monitor";
describe("monitor helpers", () => {
  const now = new Date("2026-03-10T12:00:00.000Z");
  it("ago is plain words", () => {
    expect(ago("2026-03-10T01:00:00.000Z", now)).toBe("today");
    expect(ago("2026-03-09T01:00:00.000Z", now)).toBe("yesterday");
    expect(ago("2026-03-08T01:00:00.000Z", now)).toBe("2 days ago");
  });
  it("model counts overdue and seats", () => {
    const m = monitorModel({ status: "open", capacity: 60, confirmed: 38, waitlisted: 4, starts_at: "2026-03-20T00:00:00.000Z" },
      [{ due_at: "2026-03-01T00:00:00.000Z", status: "todo" }, { due_at: "2026-03-01T00:00:00.000Z", status: "done" }], now);
    expect(m).toMatchObject({ seatText: "38 / 60", seatPercent: 63, waitlist: 4, overdue: 1, tasksDone: 1, tasksTotal: 2 });
  });
});
