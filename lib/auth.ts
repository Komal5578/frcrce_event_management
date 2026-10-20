import { redirect } from "next/navigation";
import { getDb, getEnv } from "@/lib/db";
import { readSession } from "@/lib/session";

export const ROLES = ["coordinator", "student", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = { coordinator: "Coordinator", student: "Student", admin: "Admin" };

export function parseRole(v: unknown): Role | null {
  return ROLES.find((r) => r === v) ?? null;
}

/** The only redirect targets in the app after login (T-03-17). */
export function homeFor(role: Role): string {
  return `/${role}`;
}

export const DEMO_EMAILS: Record<Role, string> = {
  coordinator: "coordinator@demo.college.test",
  student: "student@demo.college.test",
  admin: "admin@demo.college.test",
};
export const demoEmail = (role: Role) => DEMO_EMAILS[role];

export function isDemoEnabled(env: { DEMO_LOGIN?: string } = getEnv()) {
  return env.DEMO_LOGIN === "true";
}

export type LoginRow = { id: string; role: string; password_hash: string };
export const findLoginUser = (email: string) =>
  getDb().prepare("SELECT id, role, password_hash FROM profiles WHERE email = ?").bind(email.toLowerCase()).first<LoginRow>();

export async function getCurrentProfile() {
  const row = await readSession();
  const role = parseRole(row?.role);
  if (!row || !role) return null;
  return { id: row.id, name: row.name, role };
}

export async function requireRole(role: Role) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
