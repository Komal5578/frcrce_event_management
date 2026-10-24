import {
  AlarmClock, CircleCheck, CirclePlay, CircleX, Circle, CornerUpLeft, DoorOpen, Hourglass, Loader,
  Pencil, ShieldCheck, TicketCheck, TrendingDown, TriangleAlert, Users, Clock, type LucideIcon,
} from "lucide-react";
import type { EventItem } from "./types";

/** One vocabulary, one table (`dom-status-vocabulary`): icon + word + colour, everywhere. */
export const STATUS_META = {
  draft: { label: "Draft", icon: Pencil },
  pending: { label: "Pending approval", icon: Clock },
  approved: { label: "Approved", icon: ShieldCheck },
  open: { label: "Open", icon: DoorOpen },
  ongoing: { label: "Ongoing", icon: CirclePlay },
  completed: { label: "Completed", icon: CircleCheck },
  cancelled: { label: "Cancelled", icon: CircleX },
  full: { label: "Full", icon: Users },
  returned: { label: "Returned", icon: CornerUpLeft },
  todo: { label: "To do", icon: Circle },
  doing: { label: "In progress", icon: Loader },
  done: { label: "Done", icon: CircleCheck },
  overdue: { label: "Overdue", icon: AlarmClock },
  registered: { label: "Registered", icon: TicketCheck },
  waitlisted: { label: "Waitlisted", icon: Hourglass },
  clash: { label: "Clash", icon: TriangleAlert },
  low: { label: "Low registrations", icon: TrendingDown },
} satisfies Record<string, { label: string; icon: LucideIcon }>;

export type StatusKey = keyof typeof STATUS_META;

/** An open event with no seats left is shown as Full. */
export function eventStatus(e: Pick<EventItem, "status" | "capacity" | "confirmed">): StatusKey {
  if (e.status === "open" && e.capacity != null && (e.confirmed ?? 0) >= e.capacity) return "full";
  return (e.status in STATUS_META ? e.status : "draft") as StatusKey;
}

export function taskStatus(t: { status: string; due_at?: string | null }): StatusKey {
  if (t.status === "done") return "done";
  if (t.due_at && new Date(t.due_at).getTime() < Date.now()) return "overdue";
  return t.status === "doing" ? "doing" : "todo";
}

export const regStatus = (s: string): StatusKey =>
  s === "confirmed" ? "registered" : s === "waitlisted" ? "waitlisted" : "cancelled";

export const seatsLeft = (e: Pick<EventItem, "capacity" | "confirmed">) =>
  e.capacity == null ? null : Math.max(0, e.capacity - (e.confirmed ?? 0));
