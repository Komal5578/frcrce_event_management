"use client";

import { RoleGuard } from "@/components/shell/guard";
import { StudentShell } from "@/components/shell/student-shell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="student">{(name) => <StudentShell name={name}>{children}</StudentShell>}</RoleGuard>;
}
