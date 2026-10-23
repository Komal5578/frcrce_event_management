import type { ReactNode } from "react";
import { Bell, ListChecks, Search, Ticket } from "lucide-react";
import { StudentShell } from "@/components/ui/student-shell";
import { type NavItem } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { listNotifications } from "@/lib/domain/notifications";
import { myProfile } from "@/lib/domain/people";
import { signOut } from "@/app/login/actions";
import { FlashProvider } from "./student/_components/flash";

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole("student");
  const actor = { id: profile.id, role: profile.role };
  const [me, notes] = await Promise.all([myProfile(actor), listNotifications(actor)]);
  const unread = notes.filter((n) => !n.read_at).length;
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
