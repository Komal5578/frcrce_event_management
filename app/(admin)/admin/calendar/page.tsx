import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listBookings } from "@/lib/domain/admin";
import { listVenues } from "@/lib/domain/catalog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { dayKey, localToIso } from "@/lib/format";
import { noConflicts, weekColumns } from "../_lib/lanes";
import { VenueLanes } from "../_components/venue-lanes";
import { Agenda } from "../_components/agenda";

export const metadata: Metadata = { title: "Calendar - College Events" };
const btn = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-ui bg-surface px-4 py-2 text-label font-semibold";
const LEGEND: StatusKey[] = ["draft", "pending", "approved", "open", "ongoing", "completed", "returned", "clash"];
const shift = (m: string, n: number) => { const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); };

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string; w?: string; view?: string }> }) {
  const sp = await searchParams;
  const p = await requireRole("admin");
  const actor = { id: p.id, role: p.role };
  const today = dayKey(new Date().toISOString());
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : today.slice(0, 7);
  const monthStart = `${month}-01`;
  const from = localToIso(monthStart, "00:00")!, to = localToIso(`${shift(month, 1)}-01`, "00:00")!;
  const [bookings, venues] = await Promise.all([listBookings(actor, from, to), listVenues(actor)]);
  const dow = (new Date(monthStart + "T00:00:00Z").getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
  const weeks = Math.ceil((dow + days) / 7);
  const todayWeek = today.startsWith(month) ? Math.floor((dow + +today.slice(8, 10) - 1) / 7) : 0;
  const w = Math.min(Math.max(Number.isInteger(+(sp.w ?? "")) && sp.w ? +sp.w - 1 : todayWeek, 0), weeks - 1);
  const view = sp.view === "agenda" ? "agenda" : "week";
  const label = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(monthStart + "T00:00:00Z"));
  const q = (m: string, extra = "") => `/admin/calendar?month=${m}&view=${view}${extra}`;
  const used = new Set(bookings.map((b) => b.status));
  const shown = venues.filter((v) => v.active || bookings.some((b) => b.venue_id === v.id));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">Calendar</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={q(shift(month, -1))} className={btn}>Previous month</Link>
        <h2 aria-live="polite" className="min-w-40 text-center text-heading font-semibold">{label}</h2>
        <Link href={q(shift(month, 1))} className={btn}>Next month</Link>
        <form method="get" className="flex gap-2 sm:ml-auto" aria-label="Calendar view">
          <input type="hidden" name="month" value={month} />
          <Button type="submit" name="view" value="week" variant="secondary" aria-pressed={view === "week"} className={view === "week" ? "border-accent" : ""}>Week lanes</Button>
          <Button type="submit" name="view" value="agenda" variant="secondary" aria-pressed={view === "agenda"} className={view === "agenda" ? "border-accent" : ""}>Agenda</Button>
        </form>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col gap-1"><p className="text-heading font-semibold">No events this month</p><p className="text-body text-muted">Pick another month.</p></div>
      ) : (
        <>
          {noConflicts(bookings)
            ? <Alert variant="info" title="No conflicts this month." />
            : <Alert variant="warning" title="Some events overlap or sit on a retired venue. They are marked Clash below." />}
          {view === "week" && (
            <>
              <nav aria-label="Weeks" className="hidden flex-wrap gap-2 md:flex">
                {Array.from({ length: weeks }, (_, i) => (
                  <Link key={i} href={q(month, `&w=${i + 1}`)} aria-current={i === w ? "true" : undefined} className={`${btn} ${i === w ? "border-accent" : ""}`}>Week {i + 1}</Link>
                ))}
              </nav>
              <div className="hidden md:block"><VenueLanes venues={shown} bookings={bookings} days={weekColumns(monthStart, w)} /></div>
            </>
          )}
          <div className={view === "week" ? "md:hidden" : ""}><Agenda bookings={bookings} /></div>
          <section aria-label="Legend" className="flex flex-col gap-2">
            <h2 className="text-heading font-semibold">Legend</h2>
            <ul className="flex flex-wrap gap-2">
              {LEGEND.filter((k) => k === "clash" || used.has(k)).map((k) => <li key={k}><StatusBadge status={k} /></li>)}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
