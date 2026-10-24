import type { components } from "./api-types";

type S = components["schemas"];
export type EventItem = S["EventViewItem"];
export type TaskItem = S["TaskItem"];
export type MyTaskItem = S["MyTaskItem"];
export type RegistrationItem = S["RegistrationItem"];
export type VenueItem = S["VenueItem"];
export type ResourceItem = S["ResourceItem"];
export type NotificationItem = S["NotificationItem"];
export type AlertItem = S["AlertItem"];
export type BookingItem = S["BookingItem"];
export type TemplateItem = S["TemplateItem"];
export type StudentItem = S["StudentProfileItem"];
export type AllocationItem = S["AllocationItem"];
export type ReportData = S["ReportItem"];

export type Role = "student" | "coordinator" | "admin";
export type Me = { id: string; email: string; name: string; role: Role };
