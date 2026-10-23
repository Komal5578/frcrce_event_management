import type { ReactNode } from "react";
import { Bell, ListChecks, Search, Ticket } from "lucide-react";
import { StudentShell } from "@/components/ui/student-shell";
import { type NavItem } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { signOut } from "@/app/login/actions";
import { FlashProvider } from "./student/_components/flash";

type MyProfile = components["schemas"]["MyProfileItem"];
type UnreadCount = components["schemas"]["UnreadCountItem"];

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole("student");
  const [me, unreadData] = await Promise.all([
    apiClient<MyProfile>("/api/people/me").catch(() => ({ id: profile.id, name: profile.name, department: null, is_organizer: false })),
    apiClient<UnreadCount>("/api/notifications/unread-count").catch(() => ({ count: 0 })),
  ]);
  const unread = unreadData.count;
  const icon = (I: typeof Search) => <I size={20} aria-hidden="true" />;
  const navItems: NavItem[] = [
    { href: "/student", label: "Discover", icon: icon(Search) },
    { href: "/student/mine", label: "My events", icon: icon(Ticket) },
    ...(me.is_organizer ? [{ href: "/student/tasks", label: "My tasks", icon: icon(ListChecks) }] : []),
    { href: "/student/alerts", label: unread ? `Alerts (${unread} new)` : "Alerts", icon: icon(Bell) },
  ];
  return (
    <StudentShell roleLabel={ROLE_LABEL.student} userName={profile.name} navItems={navItems} signOut={signOut}>
      <FlashProvider>{children}</FlashProvider>
    </StudentShell>
  );
}

