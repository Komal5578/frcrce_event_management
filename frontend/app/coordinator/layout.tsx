"use client";

import { Bell, CalendarDays, ClipboardList, LayoutList, MapPin } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { RoleGuard } from "@/components/shell/guard";

const items: NavItem[] = [
  { href: "/coordinator", label: "My Events", icon: LayoutList, exact: true },
  { href: "/coordinator/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/map", label: "Campus Map", icon: MapPin },
  { href: "/coordinator/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/coordinator/notifications", label: "Notifications", icon: Bell },
];

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="coordinator">
      {(name) => <AppShell items={items} roleLabel="Coordinator" name={name} home="/coordinator" notifHref="/coordinator/notifications">{children}</AppShell>}
    </RoleGuard>
  );
}
