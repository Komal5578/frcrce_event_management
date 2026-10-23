import type { ReactNode } from "react";
import { Bell, CalendarCheck, CalendarDays, FileBarChart, ListChecks } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { signOut } from "@/app/login/actions";

type UnreadCount = components["schemas"]["UnreadCountItem"];

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole("coordinator");
  const unreadData = await apiClient<UnreadCount>("/api/notifications/unread-count").catch(() => ({ count: 0 }));
  const unread = unreadData.count;
  const navItems = [
    { href: "/coordinator", label: "My Events", icon: <CalendarCheck size={20} aria-hidden="true" /> },
    { href: "/coordinator/calendar", label: "Calendar", icon: <CalendarDays size={20} aria-hidden="true" /> },
    { href: "/coordinator/tasks", label: "Tasks", icon: <ListChecks size={20} aria-hidden="true" /> },
    { href: "/coordinator/notifications", label: unread ? `Notifications (${unread} new)` : "Notifications", icon: <Bell size={20} aria-hidden="true" /> },
    { href: "/coordinator/reports", label: "Reports", icon: <FileBarChart size={20} aria-hidden="true" /> },
  ];

  return (
    <AppShell roleLabel={ROLE_LABEL.coordinator} userName={profile.name} navItems={navItems} signOut={signOut}>
      {children}
    </AppShell>
  );
}
