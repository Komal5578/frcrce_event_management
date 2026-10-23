import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { BOOKABLE_HOURS_PER_DAY } from "@/lib/rules";
import { AttentionList } from "@/components/ui/attention-list";
import { stats } from "./_lib/dashboard";
import { BarList } from "./_components/bar-list";

type EventViewItem = components["schemas"]["EventViewItem"];
type VenueItem = components["schemas"]["VenueItem"];
type TaskItem = components["schemas"]["TaskItem"];
type AlertItem = components["schemas"]["AlertItem"];

const linkBtn = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-accent bg-accent px-4 py-2 text-label font-semibold text-white";

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-display font-semibold tabular-nums">{value}</p>
      <p className="text-label">{label}</p>
      {note && <p className="text-label text-muted">{note}</p>}
    </div>
  );
}

export default async function Page() {
  await requireRole("admin");
  const now = new Date();

  const [events, venues, tasks, alerts] = await Promise.all([
    apiClient<EventViewItem[]>("/api/events"),
    apiClient<VenueItem[]>("/api/venues"),
    apiClient<TaskItem[]>("/api/tasks/coordinator"),
    apiClient<AlertItem[]>("/api/notifications/alerts"),
  ]);

  const s = stats(events, venues, tasks, now);

  return (
    <div className="flex flex-col gap-12">
      <h1 className="text-display font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        <section className="flex flex-col gap-4 md:col-span-3">
          {s.pendingCount > 0 ? (
            <>
              <Stat label="Waiting for your decision" value={s.pendingCount} />
              <div><Link href="/admin/approvals" className={linkBtn}>Review approvals</Link></div>
            </>
          ) : (
            <>
              <p className="text-display font-semibold">Nothing needs your decision</p>
              <p className="text-body text-muted">New submissions will appear here.</p>
            </>
          )}
        </section>
        <Stat label="Events this month" value={s.eventsThisMonth} />
        <Stat label="Open for registration" value={s.openCount} />
        <Stat label="Venue use this month" value={s.overallText} note="of bookable hours" />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <BarList title="Venue use" bars={s.venues} max={100} empty="No venues yet." />
        <BarList title="Events by department" bars={s.departments} max={0} empty="No events this month." />
      </div>
      <p className="text-label text-muted">Booked hours divided by {BOOKABLE_HOURS_PER_DAY} bookable hours a day</p>

      <AttentionList items={alerts} />
    </div>
  );
}
