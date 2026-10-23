import type { ReactNode } from "react";
import { Building2, CalendarDays, FileBarChart, LayoutDashboard, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { listEventsWithSeats } from "@/lib/domain/views";
import { signOut } from "@/app/login/actions";

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole("admin");
  const pending = (await listEventsWithSeats({ id: profile.id, role: profile.role })).filter((e) => e.status === "pending").length;
  const icon = { "aria-hidden": true, size: 20 } as const;
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard {...icon} /> },
    { href: "/admin/approvals", label: pending ? `Approvals (${pending} waiting)` : "Approvals", icon: <ShieldCheck {...icon} /> },
    { href: "/admin/calendar", label: "Calendar", icon: <CalendarDays {...icon} /> },
    { href: "/admin/catalog", label: "Venues and Resources", icon: <Building2 {...icon} /> },
    { href: "/admin/reports", label: "Reports", icon: <FileBarChart {...icon} /> },
  ];
  return (
    <AppShell roleLabel={ROLE_LABEL.admin} userName={profile.name} navItems={navItems} signOut={signOut}>
      {children}
    </AppShell>
  );
}
