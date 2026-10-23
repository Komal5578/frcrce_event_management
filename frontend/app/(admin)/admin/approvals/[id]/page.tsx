import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listEventsWithSeats } from "@/lib/domain/views";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRange } from "@/lib/format";
import { loadClash } from "../../_lib/load";
import { ClashCheck } from "../../_components/clash-check";
import { DecisionCard } from "../../_components/decision-card";

export const metadata: Metadata = { title: "Review approval - College Events" };
const back = "inline-flex min-h-11 min-w-11 items-center underline";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requireRole("admin");
  const actor = { id: p.id, role: p.role };
  const { event: e, check, resources } = await loadClash(actor, id);
  const pending = e.status === "pending";
  const queue = (await listEventsWithSeats(actor)).filter((x) => x.status === "pending" && x.id !== e.id);
  const nextId = (queue.find((x) => (x.starts_at ?? "") > (e.starts_at ?? "")) ?? queue[0])?.id ?? null;
  const when = e.starts_at && e.ends_at ? formatRange(e.starts_at, e.ends_at) : "No time yet";
  const where = e.venue_name ? `${e.venue_name} (capacity ${e.venue_capacity ?? 0})` : "No venue yet";
  // Fixed slots below keep DecisionCard mounted across the post-decision refresh.
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/approvals" className={`${back} lg:hidden`}>Back to approvals</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-display font-semibold">{e.title}</h1>
        <StatusBadge status={e.status as "pending"} />
      </div>
      {!pending && <Alert variant="info" title="This event is no longer waiting for review"><Link href="/admin/approvals" className={back}>Back to approvals</Link></Alert>}
      <dl className="grid max-w-[65ch] grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
        <dt className="font-semibold">When</dt><dd>{when}</dd>
        <dt className="font-semibold">Where</dt><dd>{where}</dd>
        <dt className="font-semibold">Seats</dt><dd>{e.capacity ?? "Not set"}</dd>
        <dt className="font-semibold">Department</dt><dd>{e.department ?? "Not set"}</dd>
        <dt className="font-semibold">Coordinator</dt><dd>{e.coordinator_name ?? "Unknown"}</dd>
      </dl>
      {pending && <ClashCheck check={check} resources={resources} />}
      <DecisionCard
        eventId={e.id}
        pending={pending}
        canApprove={check.ok}
        nextId={nextId}
        summary={{
          title: e.title, when, venue: where, seats: String(e.capacity ?? "Not set"), clash: check.message,
          resources: resources.length ? resources.map((r) => `${r.name} x${r.asked}`).join(", ") : "None",
        }}
      />
    </div>
  );
}
