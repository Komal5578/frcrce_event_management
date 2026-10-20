import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listEventsWithSeats } from "@/lib/domain/views";
import { listVenues } from "@/lib/domain/catalog";
import { listCoordinatorTasks } from "@/lib/domain/allocations";
import { BOOKABLE_HOURS_PER_DAY } from "@/lib/domain/rules";
import { StatusBadge } from "@/components/ui/status-badge";
import { stats } from "./_lib/dashboard";
import { BarList } from "./_components/bar-list";

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
  const profile = await requireRole("admin");
  const actor = { id: profile.id, role: profile.role };
  const [events, venues, tasks] = await Promise.all([listEventsWithSeats(actor), listVenues(actor), listCoordinatorTasks(actor)]);
  const s = stats(events, venues, tasks, new Date());

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

      <section className="flex flex-col gap-3">
        <h2 className="text-heading font-semibold">Needs attention</h2>
        {s.lowReg.length === 0 && s.overdueCount === 0 ? <p className="text-body text-muted">Nothing needs attention.</p> : (
          <ul className="flex flex-col gap-3">
            {s.lowReg.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3">
                <StatusBadge status="lowreg" />
                <Link href="/admin/calendar" className="inline-flex min-h-11 items-center text-body underline">{e.title} has low registrations</Link>
              </li>
            ))}
            {s.overdueCount > 0 && (
              <li className="flex flex-wrap items-center gap-3">
                <StatusBadge status="overdue" />
                <Link href="/admin/calendar" className="inline-flex min-h-11 items-center text-body underline">
                  {s.overdueCount === 1 ? "1 task is overdue" : `${s.overdueCount} tasks are overdue`}
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
