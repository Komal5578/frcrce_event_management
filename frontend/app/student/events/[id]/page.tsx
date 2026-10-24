"use client";

import { motion } from "motion/react";
import { CalendarClock, Building2, Info, MapPin, TriangleAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { StudentHead } from "@/components/shell/student-shell";
import { Button } from "@/components/ui/button";
import { Ring } from "@/components/ui/meters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { fmtDay, fmtRange } from "@/lib/format";
import { eventStatus, regStatus, seatsLeft } from "@/lib/status";
import type { EventItem, RegistrationItem } from "@/lib/types";

function Tick() {
  return (
    <svg viewBox="0 0 52 52" className="size-14" aria-hidden>
      <motion.circle cx="26" cy="26" r="24" fill="none" stroke="var(--good)" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d="M15 27l8 8 14-16" fill="none" stroke="var(--good)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.35 }} />
    </svg>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: e, error, mutate } = useSWR<EventItem>(`/api/events/${id}`);
  const { data: mine, mutate: mutateMine } = useSWR<RegistrationItem[]>("/api/registrations/mine");
  const flash = useFlash();
  const [confirm, setConfirm] = useState<"register" | "cancel" | null>(null);
  const [just, setJust] = useState<"registered" | "waitlisted" | "cancelled" | null>(null);

  if (error) return <><StudentHead title="Event" back="/student" /><div className="-mt-6 lg:mt-6 px-4 lg:px-8"><ErrorState onRetry={() => mutate()} message="We could not load this event. It may have been removed." /></div></>;
  if (!e) return <><StudentHead title="Loading…" back="/student" /><div className="-mt-6 lg:mt-6 space-y-3 px-4 lg:px-8"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div></>;

  const status = eventStatus(e);
  const left = seatsLeft(e);
  const full = status === "full";
  const registered = e.my_reg === "confirmed";
  const waitlisted = e.my_reg === "waitlisted";
  const canJoin = e.status === "open" && !registered && !waitlisted;
  const pos = (e.waitlisted ?? 0) + 1;
  const fillPct = e.capacity ? ((e.confirmed ?? 0) / e.capacity) * 100 : 0;

  const overlap = (mine ?? []).find(
    (r) => r.event_id !== e.id && r.reg_status !== "cancelled" && !["cancelled", "completed"].includes(r.event_status) && r.starts_at && r.ends_at && e.starts_at && e.ends_at &&
      new Date(r.starts_at) < new Date(e.ends_at) && new Date(e.starts_at) < new Date(r.ends_at),
  );

  async function register() {
    try {
      const r = await api<{ status: string }>(`/api/events/${e!.id}/register`, { method: "POST" });
      setJust(r.status === "waitlisted" ? "waitlisted" : "registered");
      flash(r.status === "waitlisted" ? `You are on the waitlist for ${e!.title}.` : `You are registered for ${e!.title}.`);
    } catch (err) {
      flash(errText(err), { kind: "err" });
    }
    setConfirm(null);
    mutate(); mutateMine();
  }
  async function cancel() {
    try {
      await api(`/api/events/${e!.id}/register`, { method: "DELETE" });
      setJust("cancelled");
      flash("Registration cancelled. Your seat has been released.");
    } catch (err) {
      flash(errText(err), { kind: "err" });
    }
    setConfirm(null);
    mutate(); mutateMine();
  }

  const summary = (
    <div className="space-y-0.5"><p className="font-extrabold">{e.title}</p><p className="text-muted">{fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)}</p><p className="text-muted">{e.venue_name}</p></div>
  );

  return (
    <>
      <StudentHead title={e.title} back="/student" sub={`Hosted by ${e.department ?? "the college"}`}>
        <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={status} />{e.my_reg && e.my_reg !== "cancelled" ? <StatusBadge status={regStatus(e.my_reg)} label={waitlisted && e.my_waitlist_pos ? `Waitlisted #${e.my_waitlist_pos}` : undefined} /> : null}</div>
      </StudentHead>

      <div className="-mt-6 grid gap-4 px-4 lg:mt-6 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:px-8">
        <div className="rounded-2xl bg-surface p-5 shadow-card border border-line">
          <dl className="space-y-4">
            <div className="flex gap-3.5"><CalendarClock className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden /><div><dt className="text-xs font-bold uppercase tracking-wide text-faint">When</dt><dd className="font-bold">{fmtDay(e.starts_at)}</dd><dd className="text-sm text-muted">{fmtRange(e.starts_at, e.ends_at)}</dd></div></div>
            <div className="flex gap-3.5"><MapPin className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden /><div><dt className="text-xs font-bold uppercase tracking-wide text-faint">Where</dt><dd className="font-bold">{e.venue_name ?? "Venue to be set"}</dd>{e.venue_location ? <dd className="text-sm text-muted">{e.venue_location}</dd> : null}</div></div>
            <div className="flex gap-3.5"><UserRound className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden /><div><dt className="text-xs font-bold uppercase tracking-wide text-faint">Organised by</dt><dd className="font-bold">{e.coordinator_name ?? "College events office"}</dd></div></div>
            {e.department ? <div className="flex gap-3.5"><Building2 className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden /><div><dt className="text-xs font-bold uppercase tracking-wide text-faint">Department</dt><dd className="font-bold">{e.department}</dd></div></div> : null}
          </dl>
          {e.capacity ? (
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-purple-soft p-4">
              <Ring value={fillPct} label="Seats taken" size={76} />
              <div className="num">
                <p className="text-base font-extrabold text-ink">{left === 0 ? "No seats left" : `${left} of ${e.capacity} seats left`}</p>
                <p className="text-sm text-muted">{e.confirmed} registered{(e.waitlisted ?? 0) > 0 ? `, ${e.waitlisted} on the waitlist` : ""}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
        {just ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} role="status" className="flex flex-col items-center rounded-2xl bg-good-soft p-6 text-center border border-line">
            {just !== "cancelled" ? <Tick /> : null}
            <h2 className="mt-2 text-xl font-extrabold">{just === "registered" ? "You're registered" : just === "waitlisted" ? "You're on the waitlist" : "Registration cancelled"}</h2>
            <p className="mt-1 text-[15px] text-muted">{just === "registered" ? "Your seat is saved. We'll remind you in Notifications." : just === "waitlisted" ? "We will tell you in Notifications if a seat opens." : "You can register again any time while seats remain."}</p>
            <Link href="/student/my" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-purple px-5 font-bold text-white">View my events</Link>
          </motion.div>
        ) : canJoin ? (
          <div className="space-y-2">
            <Button variant="purple" size="lg" full onClick={() => setConfirm("register")}>{full ? "Join waitlist" : "Register"}</Button>
            {full ? <p className="text-center text-sm text-muted">This event is full. You would be number {pos} on the waitlist.</p> : null}
          </div>
        ) : registered || waitlisted ? (
          <Button variant="secondary" size="lg" full onClick={() => setConfirm("cancel")}>{waitlisted ? "Leave waitlist" : "Cancel my registration"}</Button>
        ) : (
          <p className="flex items-start gap-2 rounded-2xl bg-surface-2 p-4 text-[15px] text-muted border border-line"><Info className="mt-0.5 size-5 shrink-0" aria-hidden />Registration is not open for this event.</p>
        )}

        {e.description ? (
          <div className="rounded-2xl bg-surface p-5 border border-line"><h2 className="text-base font-extrabold">About</h2><p className="mt-1.5 max-w-prose text-[15px] leading-relaxed text-muted">{e.description}</p></div>
        ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "register"}
        verb={full ? "join the waitlist" : "register"}
        summary={summary}
        consequence={full ? `You will be added to the waitlist at position ${pos}. We will tell you if a seat opens.` : "You get a seat and a reminder the day before."}
        confirmLabel={full ? "Join waitlist" : "Confirm registration"}
        onConfirm={register}
        onCancel={() => setConfirm(null)}
      >
        {overlap ? (
          <p role="status" className="mt-4 flex gap-2 rounded-xl bg-warn-soft p-3 text-sm font-medium text-[var(--st-pending-fg)]"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />This overlaps with “{overlap.title}”. You can still confirm.</p>
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "cancel"}
        verb="cancel"
        destructive
        summary={summary}
        consequence="Your seat will be released and the next person on the waitlist is offered it."
        confirmLabel="Confirm cancel"
        onConfirm={cancel}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
