import {
  Pencil, Clock, ShieldCheck, DoorOpen, CirclePlay, CircleCheck, CircleX,
  Users, CornerUpLeft, Circle, CircleDot, CircleCheckBig, AlarmClock,
  BadgeCheck, Hourglass, TriangleAlert, TrendingDown,
} from "lucide-react";

// One vocabulary (dom-status-vocabulary). Class strings are written in full so Tailwind detects them.
// Keys: event family, task family, registration family, alert family.
export const STATUS_META = {
  // ── Event family ──────────────────────────────────────────────────────────
  draft:      { label: "Draft",            Icon: Pencil,        className: "text-status-draft-fg bg-status-draft-bg border-status-draft-fg" },
  pending:    { label: "Pending approval", Icon: Clock,         className: "text-status-pending-fg bg-status-pending-bg border-status-pending-fg" },
  approved:   { label: "Approved",         Icon: ShieldCheck,   className: "text-status-approved-fg bg-status-approved-bg border-status-approved-fg" },
  open:       { label: "Open",             Icon: DoorOpen,      className: "text-status-open-fg bg-status-open-bg border-status-open-fg" },
  ongoing:    { label: "Ongoing",          Icon: CirclePlay,    className: "text-status-ongoing-fg bg-status-ongoing-bg border-status-ongoing-fg" },
  completed:  { label: "Completed",        Icon: CircleCheck,   className: "text-status-completed-fg bg-status-completed-bg border-status-completed-fg" },
  cancelled:  { label: "Cancelled",        Icon: CircleX,       className: "text-status-cancelled-fg bg-status-cancelled-bg border-status-cancelled-fg" },
  full:       { label: "Full / Waitlist",  Icon: Users,         className: "text-status-full-fg bg-status-full-bg border-status-full-fg" },
  returned:   { label: "Returned",         Icon: CornerUpLeft,  className: "text-status-returned-fg bg-status-returned-bg border-status-returned-fg" },
  // ── Task family ───────────────────────────────────────────────────────────
  todo:       { label: "To do",            Icon: Circle,        className: "text-status-todo-fg bg-status-todo-bg border-status-todo-fg" },
  doing:      { label: "In progress",      Icon: CircleDot,     className: "text-status-doing-fg bg-status-doing-bg border-status-doing-fg" },
  done:       { label: "Done",             Icon: CircleCheckBig,className: "text-status-done-fg bg-status-done-bg border-status-done-fg" },
  overdue:    { label: "Overdue",          Icon: AlarmClock,    className: "text-status-overdue-fg bg-status-overdue-bg border-status-overdue-fg" },
  // ── Registration family ───────────────────────────────────────────────────
  registered:       { label: "Registered",  Icon: BadgeCheck,    className: "text-status-registered-fg bg-status-registered-bg border-status-registered-fg" },
  waitlisted:       { label: "Waitlisted",  Icon: Hourglass,     className: "text-status-waitlisted-fg bg-status-waitlisted-bg border-status-waitlisted-fg" },
  "reg-cancelled":  { label: "Cancelled",   Icon: CircleX,       className: "text-status-reg-cancelled-fg bg-status-reg-cancelled-bg border-status-reg-cancelled-fg" },
  // ── Alert family ──────────────────────────────────────────────────────────
  "alert-clash":    { label: "Clash",              Icon: TriangleAlert, className: "text-status-alert-clash-fg bg-status-alert-clash-bg border-status-alert-clash-fg" },
  "alert-low":      { label: "Low registrations",  Icon: TrendingDown,  className: "text-status-alert-low-fg bg-status-alert-low-bg border-status-alert-low-fg" },
  "alert-overdue":  { label: "Overdue",            Icon: AlarmClock,    className: "text-status-alert-overdue-fg bg-status-alert-overdue-bg border-status-alert-overdue-fg" },
  // ── Legacy keys (backward compat with v1 tests & ui) ─────────────────────
  clash:   { label: "Clash",              Icon: TriangleAlert, className: "text-status-clash-fg bg-status-clash-bg border-status-clash-fg" },
  lowreg:  { label: "Low registrations", Icon: TrendingDown,  className: "text-status-lowreg-fg bg-status-lowreg-bg border-status-lowreg-fg" },
} as const;

export type StatusKey = keyof typeof STATUS_META;

export function StatusBadge({ status }: { status: StatusKey }) {
  const { label, Icon, className } = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-label font-semibold leading-none ${className}`}
    >
      <Icon size={14} aria-hidden="true" className="shrink-0" />
      {label}
    </span>
  );
}
