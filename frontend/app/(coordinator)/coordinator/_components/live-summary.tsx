import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { isOverdue } from "@/lib/domain/rules";
import { formatRange, formatShortDate } from "@/lib/format";
import type { EventView } from "@/lib/domain/views";
import type { AllocationRow, TaskRow } from "@/lib/domain/allocations";
import type { readiness } from "../_lib/readiness";

/** Live Summary: rendered from the saved draft after each save. Only the readiness line is live. */
export function LiveSummary({ ev, venue, allocations, tasks, ready, now }: {
  ev: EventView; venue: { text: string; ok: boolean }; allocations: AllocationRow[]; tasks: TaskRow[];
  ready: ReturnType<typeof readiness>; now: Date;
}) {
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col"><dt className="text-label text-muted">{label}</dt><dd className="text-body">{value}</dd></div>
  );
  const earliest = tasks.map((t) => t.due_at).filter(Boolean).sort()[0];
  const late = tasks.some((t) => isOverdue(t, now));
  const oneLine = `${ready.line}. ${venue.text}`;
  return (
    <aside aria-label="Event summary" className="rounded-control border border-border-card bg-panel p-4">
      <details open className="group">
        <summary className="min-h-11 cursor-pointer py-2 text-heading font-semibold lg:pointer-events-none">
          Summary <span className="block text-label font-normal text-muted group-open:hidden">{oneLine}</span>
        </summary>
        <dl className="mt-2 flex flex-col gap-3">
          {row("What", `${ev.title || "No title yet"}, ${ev.capacity ? `${ev.capacity} seats expected` : "seats not set"}`)}
          {row("When", ev.starts_at && ev.ends_at ? formatRange(ev.starts_at, ev.ends_at) : "Not set")}
          {row("Venue", <span className="flex items-start gap-1">{venue.ok ? <CircleCheck size={16} aria-hidden="true" className="mt-1 shrink-0" /> : ev.venue_id ? <TriangleAlert size={16} aria-hidden="true" className="mt-1 shrink-0" /> : null}{venue.text}</span>)}
          {row("Resources", allocations.length ? allocations.map((a) => `${a.name} x${a.quantity}`).join(", ") : "None requested")}
          {row("Tasks", tasks.length ? <>{`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}${earliest ? `, earliest due ${formatShortDate(earliest)}` : ""}`} {late && <StatusBadge status="overdue" />}</> : "No tasks yet")}
        </dl>
        <div aria-live="polite" className="mt-4 border-t border-border-card pt-3 text-body font-semibold">
          {ready.ready ? (
            <p className="flex items-center gap-1"><CircleCheck size={18} aria-hidden="true" />Ready to submit</p>
          ) : (
            <p>Missing:{" "}
              {ready.missing.map((m, i) => (
                <span key={m.key}>{i > 0 && ", "}<Link href={`/coordinator/${ev.id}/edit?step=${m.step}`} className="underline">{m.label}</Link></span>
              ))}
            </p>
          )}
        </div>
      </details>
    </aside>
  );
}
