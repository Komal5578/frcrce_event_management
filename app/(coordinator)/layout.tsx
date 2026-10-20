import type { ReactNode } from "react";
import { Bell, CalendarCheck, CalendarDays, ListChecks } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { listNotifications } from "@/lib/domain/notifications";
import { signOut } from "@/app/login/actions";

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole("coordinator");
  const unread = (await listNotifications({ id: profile.id, role: profile.role })).filter((n) => !n.read_at).length;
  const navItems = [
    { href: "/coordinator", label: "My Events", icon: <CalendarCheck size={20} aria-hidden="true" /> },
    { href: "/coordinator/calendar", label: "Calendar", icon: <CalendarDays size={20} aria-hidden="true" /> },
    { href: "/coordinator/tasks", label: "Tasks", icon: <ListChecks size={20} aria-hidden="true" /> },
    { href: "/coordinator/notifications", label: unread ? `Notifications (${unread} new)` : "Notifications", icon: <Bell size={20} aria-hidden="true" /> },
  ];
  return (
    <AppShell roleLabel={ROLE_LABEL.coordinator} userName={profile.name} navItems={navItems} signOut={signOut}>
      {children}
    </AppShell>
  );
}
