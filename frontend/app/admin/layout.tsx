"use client";

import { Bell, CalendarRange, FileBarChart2, Inbox, Warehouse } from "lucide-react";
import useSWR from "swr";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { RoleGuard } from "@/components/shell/guard";
import type { EventItem } from "@/lib/types";

// Navigation stays at five (AD-01 Dashboard is the home, reached from the brand block; D-06).
function Shell({ name, children }: { name: string; children: React.ReactNode }) {
  const { data } = useSWR<EventItem[]>("/api/events");
  const pending = (data ?? []).filter((e) => e.status === "pending").length;
  const items: NavItem[] = [
    { href: "/admin/approvals", label: "Approvals", icon: Inbox, badge: pending || undefined },
    { href: "/admin/calendar", label: "Calendar", icon: CalendarRange },
    { href: "/admin/catalog", label: "Venues & Resources", icon: Warehouse },
    { href: "/admin/reports", label: "Reports", icon: FileBarChart2 },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ];
  return <AppShell items={items} roleLabel="Admin" name={name} home="/admin" notifHref="/admin/notifications">{children}</AppShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="admin">{(name) => <Shell name={name}>{children}</Shell>}</RoleGuard>;
}
