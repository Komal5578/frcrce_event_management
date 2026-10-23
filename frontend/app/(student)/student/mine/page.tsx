import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api";
import { dayKey, formatRange } from "@/lib/format";
import { Calendar } from "../_components/calendar";
import { CancelFlow } from "../_components/cancel-flow";
import { group, reminders, type MyRegistration } from "../_lib/mine";

export const metadata = { title: "My events - College Events" };
export const dynamic = "force-dynamic";

const when = (r: MyRegistration) => (r.starts_at && r.ends_at ? formatRange(r.starts_at, r.ends_at) : "Time to be confirmed");
const badge = (r: MyRegistration): StatusKey =>
  r.reg_status === "cancelled" ? "cancelled"
  : r.event_status === "cancelled" ? "cancelled"
  : r.event_status === "completed" ? "completed"
  : r.reg_status === "waitlisted" ? "waitlisted" : "registered";

function Card({ r, upcoming }: { r: MyRegistration; upcoming: boolean }) {
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border-card bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-heading font-semibold">
          <Link href={`/student/events/${r.event_id}`} className="text-accent underline">{r.title}</Link>
        </h3>
        <StatusBadge status={badge(r)} />
      </div>
      <p className="text-body">{when(r)}{r.venue_name ? `, ${r.venue_name}` : ""}</p>
      {r.reg_status === "waitlisted" && r.waitlist_pos && upcoming && <p className="text-body">You are number {r.waitlist_pos} on the waitlist.</p>}
      {r.reg_status === "cancelled" && <p className="text-body">You cancelled this registration. Your seat was released.</p>}
      {r.reg_status !== "cancelled" && r.event_status === "cancelled" && <p className="text-body">This event was cancelled.</p>}
      {upcoming && <CancelFlow eventId={r.event_id} title={r.title} when={when(r)} waitlisted={r.reg_status === "waitlisted"} />}
    </li>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("student");
  const sp = await searchParams;
  const now = new Date();
  const regs = await apiClient<MyRegistration[]>("/api/registrations/mine").catch(() => []);

  const { comingUp, past } = group(regs, now);
  const view = sp.view === "month" ? "month" : "agenda";
  const m = typeof sp.m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.m) ? sp.m : dayKey(now.toISOString()).slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">My events</h1>
      {regs.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <h2 className="text-heading font-semibold">You have not registered for anything yet</h2>
          <p className="text-body">Find an event and register in two taps.</p>
          <Link href="/student" className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-label font-semibold text-white">Find events</Link>
        </div>
      ) : (
        <>
          {reminders(regs, now).map((t) => <Alert key={t} variant="info" title={t} />)}
          <Calendar regs={regs} now={now} view={view} month={m} />
          <section aria-labelledby="up" className="flex flex-col gap-3">
            <h2 id="up" className="text-heading font-semibold">Coming up</h2>
            {comingUp.length ? <ul className="flex flex-col gap-3">{comingUp.map((r) => <Card key={r.event_id} r={r} upcoming />)}</ul>
              : <p className="text-body">Nothing coming up.</p>}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past" className="flex flex-col gap-3">
              <h2 id="past" className="text-heading font-semibold">Past and cancelled</h2>
              <ul className="flex flex-col gap-3">{past.map((r) => <Card key={r.event_id} r={r} upcoming={false} />)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
