import { expect, it } from "vitest";
import { applyFilters, echoText, parseParams } from "@/app/(student)/student/_lib/filter";
import type { EventView } from "@/lib/domain/views";

const NOW = new Date("2026-03-01T06:00:00.000Z");
const day = (d: number, h = 0) => new Date(NOW.getTime() + d * 86_400_000 + h * 3_600_000).toISOString();
const ev = (id: string, o: Partial<EventView> = {}) => ({
  id, title: id, type: "workshop", department: "Computer Science", venue_name: "Hall A", status: "open", capacity: 10, confirmed: 3,
  starts_at: day(2), ends_at: day(2, 2), my_reg: null, ...o,
}) as EventView;

const all = parseParams({ f: "1" }, null);

it("defaults on first visit: this week on, department from profile", () => {
  const p = parseParams({}, "Computer Science");
  expect(p).toMatchObject({ week: true, department: "Computer Science" });
  expect(parseParams({ f: "1" }, "Computer Science")).toMatchObject({ week: false, department: "" });
});
it("this week keeps the next 7 days only", () => {
  const out = applyFilters([ev("soon"), ev("later", { starts_at: day(9), ends_at: day(9, 1) }), ev("past", { starts_at: day(-3), ends_at: day(-3, 1) })],
    { ...all, week: true }, NOW);
  expect(out.map((e) => e.id)).toEqual(["soon"]);
});
it("search is case-insensitive over title, type, department, venue", () => {
  const es = [ev("Robotics Talk", { type: "lecture", venue_name: "Lab 3" }), ev("Quiz")];
  expect(applyFilters(es, { ...all, q: "ROBOT" }, NOW)).toHaveLength(1);
  expect(applyFilters(es, { ...all, q: "lab 3" }, NOW)).toHaveLength(1);
  expect(applyFilters(es, { ...all, q: "lecture" }, NOW)).toHaveLength(1);
});
it("chips and selects", () => {
  const es = [ev("a"), ev("b", { status: "ongoing" }), ev("c", { confirmed: 10 }), ev("d", { type: "lecture", department: "Civil", venue_name: "Lab 3" })];
  expect(applyFilters(es, { ...all, open: true }, NOW).map((e) => e.id)).toEqual(["a", "c", "d"]);
  expect(applyFilters(es, { ...all, seats: true }, NOW).map((e) => e.id)).toEqual(["a", "b", "d"]);
  expect(applyFilters(es, { ...all, type: "lecture" }, NOW).map((e) => e.id)).toEqual(["d"]);
  expect(applyFilters(es, { ...all, department: "Civil" }, NOW).map((e) => e.id)).toEqual(["d"]);
  expect(applyFilters(es, { ...all, venue: "Lab 3" }, NOW).map((e) => e.id)).toEqual(["d"]);
});
it("from/to compare by display-zone day", () => {
  // 20:00Z is already the next day in Asia/Kolkata
  const e = ev("late", { starts_at: "2026-03-05T20:00:00.000Z", ends_at: "2026-03-05T21:00:00.000Z" });
  expect(applyFilters([e], { ...all, from: "2026-03-06", to: "2026-03-06" }, NOW)).toHaveLength(1);
  expect(applyFilters([e], { ...all, to: "2026-03-05" }, NOW)).toHaveLength(0);
});
it("cancelled only when the student was registered; sorted by start", () => {
  const es = [ev("x", { status: "cancelled" }), ev("y", { status: "cancelled", my_reg: "confirmed" }), ev("z", { starts_at: day(1), ends_at: day(1, 1) }), ev("w")];
  expect(applyFilters(es, all, NOW).map((e) => e.id)).toEqual(["z", "y", "w"]);
  expect(applyFilters(es, all, NOW).some((e) => e.id === "x")).toBe(false);
});
it("echo text", () => {
  expect(echoText({ ...all, week: true, department: "Computer Science" }, 12)).toBe("Showing: this week, Computer Science. 12 events found.");
  expect(echoText(all, 1)).toBe("Showing: all events. 1 event found.");
});
