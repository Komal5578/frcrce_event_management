import { Pencil, Clock, ShieldCheck, DoorOpen, CirclePlay, CircleCheck, CircleX, Users, CornerUpLeft, BadgeCheck, Hourglass, Circle, CircleDot, CircleCheckBig, AlarmClock, TriangleAlert, TrendingDown } from "lucide-react";

// One vocabulary (dom-status-vocabulary, X1). Class strings are written in full so Tailwind detects them.
// New statuses (tasks, registrations, alerts) are added here with a token pair in globals.css.
export const STATUS_META = {
  draft: { label: "Draft", Icon: Pencil, className: "text-status-draft-fg bg-status-draft-bg border-status-draft-fg" },
  pending: { label: "Pending approval", Icon: Clock, className: "text-status-pending-fg bg-status-pending-bg border-status-pending-fg" },
  approved: { label: "Approved", Icon: ShieldCheck, className: "text-status-approved-fg bg-status-approved-bg border-status-approved-fg" },
  open: { label: "Open", Icon: DoorOpen, className: "text-status-open-fg bg-status-open-bg border-status-open-fg" },
  ongoing: { label: "Ongoing", Icon: CirclePlay, className: "text-status-ongoing-fg bg-status-ongoing-bg border-status-ongoing-fg" },
  completed: { label: "Completed", Icon: CircleCheck, className: "text-status-completed-fg bg-status-completed-bg border-status-completed-fg" },
  cancelled: { label: "Cancelled", Icon: CircleX, className: "text-status-cancelled-fg bg-status-cancelled-bg border-status-cancelled-fg" },
  full: { label: "Full / Waitlist", Icon: Users, className: "text-status-full-fg bg-status-full-bg border-status-full-fg" },
  returned: { label: "Returned", Icon: CornerUpLeft, className: "text-status-returned-fg bg-status-returned-bg border-status-returned-fg" },
  registered: { label: "Registered", Icon: BadgeCheck, className: "text-status-registered-fg bg-status-registered-bg border-status-registered-fg" },
  waitlisted: { label: "Waitlisted", Icon: Hourglass, className: "text-status-waitlisted-fg bg-status-waitlisted-bg border-status-waitlisted-fg" },
  todo: { label: "To do", Icon: Circle, className: "text-status-todo-fg bg-status-todo-bg border-status-todo-fg" },
  doing: { label: "In progress", Icon: CircleDot, className: "text-status-doing-fg bg-status-doing-bg border-status-doing-fg" },
  done: { label: "Done", Icon: CircleCheckBig, className: "text-status-done-fg bg-status-done-bg border-status-done-fg" },
  overdue: { label: "Overdue", Icon: AlarmClock, className: "text-status-overdue-fg bg-status-overdue-bg border-status-overdue-fg" },
  clash: { label: "Clash", Icon: TriangleAlert, className: "text-status-clash-fg bg-status-clash-bg border-status-clash-fg" },
  lowreg: { label: "Low registrations", Icon: TrendingDown, className: "text-status-lowreg-fg bg-status-lowreg-bg border-status-lowreg-fg" },
} as const;

export type StatusKey = keyof typeof STATUS_META;

export function StatusBadge({ status }: { status: StatusKey }) {
  const { label, Icon, className } = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-2 py-1 text-label font-semibold ${className}`}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </span>
  );
}
