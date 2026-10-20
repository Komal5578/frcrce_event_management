// Phase 4 owner of this folder overwrites this stub; layout guard via requireRole must stay.
import type { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole('student');
  return (
    <AppShell roleLabel={ROLE_LABEL.student} userName={profile.name} navItems={[]} signOut={signOut}>
      {children}
    </AppShell>
  );
}
