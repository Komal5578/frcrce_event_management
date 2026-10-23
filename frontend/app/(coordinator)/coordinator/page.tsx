import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AttentionList } from "@/components/ui/attention-list";
import { requireRole } from "@/lib/auth";
import { isOverdue } from "@/lib/rules";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { EventCard } from "./_components/event-card";
import { filterEvents, isPast, needsYou, type Chip } from "./_lib/monitor";

export const metadata: Metadata = { title: "My Events - College Events" };

type EventViewItem = components["schemas"]["EventViewItem"];
type TaskItem = components["schemas"]["TaskItem"];
type AlertItem = components["schemas"]["AlertItem"];

const CHIPS: { value: Chip; label: string }[] = [
  { value: "attention", label: "Needs attention" },
  { value: "drafts", label: "Drafts" },
  { value: "past", label: "Past" },
];
const PRIMARY = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-accent bg-accent px-4 py-2 text-label font-semibold text-white";

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string | string[] }> }) {
  await requireRole("coordinator");
  const { f } = await searchParams;
  const chips = (Array.isArray(f) ? f : f ? [f] : []).filter((v): v is Chip => CHIPS.some((c) => c.value === v));
  const now = new Date();

  const [events, tasks, alerts] = await Promise.all([
    apiClient<EventViewItem[]>("/api/events"),
    apiClient<TaskItem[]>("/api/tasks/coordinator"),
    apiClient<AlertItem[]>("/api/notifications/alerts"),
  ]);

  const overdue = new Map<string, number>();
  for (const t of tasks) if (isOverdue(t, now)) overdue.set(t.event_id, (overdue.get(t.event_id) ?? 0) + 1);
  const overdueOf = (e: { id: string }) => overdue.get(e.id) ?? 0;

  const shown = filterEvents(events, chips, overdueOf, now);
  const needYou = events.filter((e) => !isPast(e, now) && needsYou(e, overdueOf(e))).length;
  const returned = events.filter((e) => e.status === "returned");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display font-semibold">My Events</h1>
          <p className="text-body text-muted">{events.length} {events.length === 1 ? "event" : "events"}, {needYou} need you</p>
        </div>
        <Link href="/coordinator/new" className={PRIMARY}>New event</Link>
      </div>

      <AttentionList items={alerts} />

      {returned.map((e) => (
        <Alert key={e.id} variant="warning" title={`${e.title} was returned: ${e.return_reason ?? "no reason was given"}`}>
          <Link href={`/coordinator/${e.id}/edit`} className="font-semibold underline">Fix it</Link>
        </Alert>
      ))}

      {events.length === 0 ? (
        <Card className="flex flex-col items-start gap-3">
          <h2 className="text-heading font-semibold">No events yet</h2>
          <p className="text-body">Start one from a template and it saves as you go.</p>
          <Link href="/coordinator/new" className={PRIMARY}>New event</Link>
        </Card>
      ) : (
        <>
          <form method="get" aria-label="Filter events" className="flex flex-wrap items-center gap-2">
            {CHIPS.map((c) => (
              <label key={c.value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-border-ui bg-surface px-4 text-label font-semibold hover:bg-panel has-checked:border-2 has-checked:border-accent has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
                <input type="checkbox" name="f" value={c.value} defaultChecked={chips.includes(c.value)} className="peer sr-only" />
                <Check size={16} aria-hidden="true" className="hidden peer-checked:block" />
                {c.label}
              </label>
            ))}
            <button type="submit" className="min-h-11 min-w-11 rounded-control border border-border-ui bg-surface px-4 text-label font-semibold hover:bg-panel">Apply filters</button>
          </form>
          {shown.length === 0 ? (
            <Card className="flex flex-col items-start gap-3">
              <h2 className="text-heading font-semibold">Nothing matches these filters</h2>
              <Link href="/coordinator" className="font-semibold underline">Show all current events</Link>
            </Card>
          ) : (
            <ul className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
              {shown.map((e) => <li key={e.id} className="flex flex-col"><EventCard ev={e} overdue={overdueOf(e)} now={now} /></li>)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
