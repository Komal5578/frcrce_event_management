import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Approvals - College Events" };

export default async function Page() {
  await requireRole("admin");
  return <p className="text-heading font-semibold text-muted">Choose an event to review</p>;
}
