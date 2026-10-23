// Pure form parsing for the coordinator. Whitelists fields; never reads status or user ids (T-04-13).
import { localToIso } from "@/lib/format";
import type { DraftPatch } from "@/lib/domain/drafts";

export type Fields = Record<string, FormDataEntryValue | null | undefined>;
export type Parsed<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

export const toFields = (x: FormData | Fields): Fields => (x instanceof FormData ? Object.fromEntries(x.entries()) : x);
const str = (f: Fields, k: string) => (typeof f[k] === "string" ? (f[k] as string).trim() : "");

export const E = {
  title: "Enter a title, for example Quiz Night.",
  seats: "Enter the number of seats as a whole number, at least 1.",
  date: "Choose a date.",
  start: "Choose a start time.",
  end: "Choose an end time.",
  order: "Choose an end time after the start time.",
  taskTitle: "Enter a task name, for example Book the sound system.",
  assignee: "Choose who will do this task.",
  due: "Choose a due date.",
} as const;

export function parseDetails(f: Fields): Parsed<DraftPatch> {
  const fieldErrors: Record<string, string> = {};
  const title = str(f, "title");
  if (!title || title.length > 120) fieldErrors.title = E.title;
  const seatsRaw = str(f, "seats");
  const seats = Number(seatsRaw);
  if (!/^\d+$/.test(seatsRaw) || !Number.isSafeInteger(seats) || seats < 1) fieldErrors.seats = E.seats;
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  const description = str(f, "description");
  return { ok: true, value: { title, capacity: seats, description: description || null } };
}

/** All three empty clears the schedule; a partial entry names what is missing. */
export function parseSchedule(f: Fields): Parsed<DraftPatch> {
  const [date, start, end] = [str(f, "date"), str(f, "start"), str(f, "end")];
  if (!date && !start && !end) return { ok: true, value: { startsAt: null, endsAt: null } };
  const fieldErrors: Record<string, string> = {};
  if (!date) fieldErrors.date = E.date;
  if (!start) fieldErrors.start = E.start;
  if (!end) fieldErrors.end = E.end;
  const dateOk = !!date && localToIso(date, "00:00") !== null;
  if (date && !dateOk) fieldErrors.date = E.date;
  const startsAt = dateOk && start ? localToIso(date, start) : null;
  const endsAt = dateOk && end ? localToIso(date, end) : null;
  if (dateOk && start && !startsAt) fieldErrors.start = E.start;
  if (dateOk && end && !endsAt) fieldErrors.end = E.end;
  if (startsAt && endsAt && endsAt <= startsAt) fieldErrors.end = E.order;
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, value: { startsAt, endsAt } };
}

export type TaskInput = { title: string; assigneeId: string; dueAt: string };
export function parseTask(f: Fields): Parsed<TaskInput> {
  const fieldErrors: Record<string, string> = {};
  const title = str(f, "title");
  const assigneeId = str(f, "assignee");
  const due = str(f, "due");
  if (!title || title.length > 120) fieldErrors.title = E.taskTitle;
  if (!assigneeId) fieldErrors.assignee = E.assignee;
  const dueAt = due ? localToIso(due, "23:59") : null; // due at the end of the chosen day
  if (!dueAt) fieldErrors.due = E.due;
  if (Object.keys(fieldErrors).length || !dueAt) return { ok: false, fieldErrors };
  return { ok: true, value: { title, assigneeId, dueAt } };
}
