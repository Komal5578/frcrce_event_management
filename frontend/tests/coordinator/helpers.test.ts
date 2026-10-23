import { describe, expect, it } from "vitest";
import { parseDetails, parseSchedule, parseTask, toFields } from "@/app/(coordinator)/coordinator/_lib/parse";
import { readiness, DISABLED_REASON } from "@/app/(coordinator)/coordinator/_lib/readiness";
import { filterEvents, monitorModel } from "@/app/(coordinator)/coordinator/_lib/monitor";

const NOW = new Date("2031-01-10T08:00:00.000Z");

describe("parse", () => {
  it("details: trims, requires title and whole seats", () => {
    expect(parseDetails({ title: "  Quiz  ", seats: "30", description: " " })).toEqual({ ok: true, value: { title: "Quiz", capacity: 30, description: null } });
    for (const seats of ["0", "1.5", "-2", "abc", ""]) {
      const r = parseDetails({ title: "Quiz", seats });
      expect(r.ok ? null : r.fieldErrors.seats).toBe("Enter the number of seats as a whole number, at least 1.");
    }
    const t = parseDetails({ title: "x".repeat(121), seats: "5" });
    expect(t.ok ? null : t.fieldErrors.title).toBe("Enter a title, for example Quiz Night.");
  });
  it("details ignore status and owner fields", () => {
    const r = parseDetails({ title: "Q", seats: "5", status: "approved", coordinator_id: "x" });
    expect(r.ok && Object.keys(r.value).sort()).toEqual(["capacity", "description", "title"]);
  });
  it("schedule: local time to ISO, order error, empty clears", () => {
    expect(parseSchedule({ date: "2031-01-01", start: "10:00", end: "12:00" })).toEqual({ ok: true, value: { startsAt: "2031-01-01T04:30:00.000Z", endsAt: "2031-01-01T06:30:00.000Z" } });
    const r = parseSchedule({ date: "2031-01-01", start: "12:00", end: "12:00" });
    expect(r.ok ? null : r.fieldErrors.end).toBe("Choose an end time after the start time.");
    expect(parseSchedule({ date: "2031-02-30", start: "10:00", end: "11:00" }).ok).toBe(false);
    expect(parseSchedule({})).toEqual({ ok: true, value: { startsAt: null, endsAt: null } });
    const part = parseSchedule({ date: "2031-01-01" });
    expect(part.ok ? null : Object.keys(part.fieldErrors)).toEqual(["start", "end"]);
  });
  it("task: requires title, assignee and due date", () => {
    const r = parseTask({ title: "", assignee: "", due: "" });
    expect(r.ok ? null : r.fieldErrors).toMatchObject({ due: "Choose a due date." });
    expect(parseTask({ title: "Mics", assignee: "u1", due: "2031-01-05" })).toEqual({ ok: true, value: { title: "Mics", assigneeId: "u1", dueAt: "2031-01-05T18:29:00.000Z" } });
  });
  it("toFields reads FormData", () => {
    const fd = new FormData(); fd.set("title", "A");
    expect(toFields(fd)).toEqual({ title: "A" });
  });
});

describe("readiness", () => {
  const full = { title: "T", capacity: 40, venue_id: "v", starts_at: "a", ends_at: "b" };
  it("ready only when everything exists and the venue fits", () => {
    expect(readiness(full, 40).ready).toBe(true);
    const small = readiness(full, 30);
    expect(small.ready).toBe(false);
    expect(small.missing[0]).toMatchObject({ key: "venue", step: 2 });
    const none = readiness({ ...full, venue_id: null, starts_at: null, capacity: null }, null);
    expect(none.missing.map((m) => [m.key, m.step])).toEqual([["seats", 1], ["venue", 2], ["date", 2]]);
    expect(none.reason).toBe(DISABLED_REASON);
    expect(none.line).toBe("Missing: seats, venue, date");
  });
});

describe("monitor", () => {
  it("builds the glance numbers and next-step sentence", () => {
    const m = monitorModel(
      { status: "open", capacity: 60, confirmed: 38, waitlisted: 4, starts_at: "2031-01-12T08:00:00.000Z" },
      [{ due_at: "2031-01-09T00:00:00.000Z", status: "todo" }, { due_at: "2031-01-20T00:00:00.000Z", status: "done" }], NOW);
    expect(m).toMatchObject({ seatPercent: 63, seatText: "38 / 60", waitlist: 4, overdue: 1, tasksDone: 1, tasksTotal: 2, next: "Next: start the event" });
    expect(m.lowReg).toBe(false);
    expect(monitorModel({ status: "open", capacity: 60, confirmed: 5, starts_at: "2031-01-12T08:00:00.000Z" }, [], NOW).lowReg).toBe(true);
    expect(monitorModel({ status: "pending", capacity: 0, confirmed: 0, starts_at: null }, [], NOW).next).toBe("Next: wait for approval");
    expect(monitorModel({ status: "returned", capacity: 1, confirmed: 0, starts_at: null }, [], NOW).next).toBe("Next: fix what the Admin asked and submit again");
  });
  it("filters: default hides past; chips add", () => {
    const mk = (id: string, status: string, ends_at: string | null = "2031-02-01T00:00:00.000Z") => ({ id, status, capacity: 5, confirmed: 0, starts_at: null, ends_at });
    const evs = [mk("d", "draft", null), mk("o", "open"), mk("c", "completed"), mk("r", "returned")];
    const ids = (chips: Parameters<typeof filterEvents>[1]) => filterEvents(evs, chips, () => 0, NOW).map((e) => e.id);
    expect(ids([])).toEqual(["d", "o", "r"]);
    expect(ids(["past"])).toEqual(["c"]);
    expect(ids(["drafts"])).toEqual(["d"]);
    expect(ids(["attention"])).toEqual(["d", "r"]);
    expect(filterEvents(evs, ["attention"], (e) => (e.id === "o" ? 1 : 0), NOW).map((e) => e.id)).toEqual(["d", "o", "r"]);
  });
});
