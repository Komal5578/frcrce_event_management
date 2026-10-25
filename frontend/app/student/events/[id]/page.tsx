"use client";

import { motion } from "motion/react";
import { Building2, CalendarClock, ChevronLeft, Info, MapPin, TriangleAlert, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { BoardSection } from "@/components/board/BoardSection";
import { Tape } from "@/components/board/Tape";
import { Stamp } from "@/components/board/Stamp";
import { Tag } from "@/components/board/Tag";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { fmtDay, fmtRange } from "@/lib/format";
import { eventStatus, seatsLeft } from "@/lib/status";
import type { EventItem, RegistrationItem } from "@/lib/types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: e, error, mutate } = useSWR<EventItem>(`/api/events/${id}`);
  const { data: mine, mutate: mutateMine } = useSWR<RegistrationItem[]>("/api/registrations/mine");
  const flash = useFlash();
  const [confirm, setConfirm] = useState<"register" | "cancel" | null>(null);
  const [just, setJust] = useState<"registered" | "waitlisted" | "cancelled" | null>(null);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] px-4 py-8 max-w-5xl mx-auto">
        <Link href="/events" className="inline-flex items-center gap-1.5 font-grotesk text-sm font-bold text-[#1E1A17] mb-6">
          <ChevronLeft className="size-4" /> Back to Noticeboard
        </Link>
        <ErrorState onRetry={() => mutate()} message="We could not load this flyer. It may have been unpinned." />
      </div>
    );
  }

  if (!e) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] px-4 py-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const status = eventStatus(e);
  const left = seatsLeft(e);
  const full = status === "full";
  const registered = e.my_reg === "confirmed" || just === "registered";
  const waitlisted = e.my_reg === "waitlisted" || just === "waitlisted";
  const canJoin = e.status === "open" && !registered && !waitlisted;
  const pos = (e.waitlisted ?? 0) + 1;

  const overlap = (mine ?? []).find(
    (r) =>
      r.event_id !== e.id &&
      r.reg_status !== "cancelled" &&
      !["cancelled", "completed"].includes(r.event_status) &&
      r.starts_at &&
      r.ends_at &&
      e.starts_at &&
      e.ends_at &&
      new Date(r.starts_at) < new Date(e.ends_at) &&
      new Date(e.starts_at) < new Date(r.ends_at)
  );

  async function register() {
    try {
      const r = await api<{ status: string }>(`/api/events/${e!.id}/register`, { method: "POST" });
      setJust(r.status === "waitlisted" ? "waitlisted" : "registered");
      flash(r.status === "waitlisted" ? `You are on the waitlist for ${e!.title}.` : `You are registered for ${e!.title}!`);
    } catch (err) {
      flash(errText(err), { kind: "err" });
    }
    setConfirm(null);
    mutate();
    mutateMine();
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
    mutate();
    mutateMine();
  }

  const summary = (
    <div className="space-y-1">
      <p className="font-grotesk font-extrabold text-[#1E1A17]">{e.title}</p>
      <p className="text-sm text-[#1E1A17]/80">{fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)}</p>
      <p className="text-sm text-[#1E1A17]/80">{e.venue_name}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 font-grotesk text-sm font-bold text-[#1E1A17] hover:underline underline-offset-4"
        >
          <ChevronLeft className="size-4" /> Back to Noticeboard
        </Link>
        <span className="font-script text-base text-[#EF4B35] rotate-[-2deg]">
          Pinned in {e.department ?? "College"} Department
        </span>
      </div>

      {/* Main Noticeboard BoardSection */}
      <BoardSection title="Official Notice" sub="Event Booking & RSVP">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-start">
          {/* ONE LARGE FLYER ON THE BOARD */}
          <div className="relative rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-6 sm:p-8 shadow-[3px_6px_16px_rgba(30,26,23,0.12)] rotate-[-0.75deg]">
            {/* Masking tape on flyer top */}
            <Tape position="top" />

            {/* REGISTERED rubber stamp thuds onto flyer on success! */}
            {registered ? (
              <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <Stamp
                  label="REGISTERED"
                  variant="registered"
                  animate={just === "registered"}
                  className="text-base sm:text-xl px-3 sm:px-4 py-1.5 sm:py-2 border-[3px]"
                />
              </div>
            ) : waitlisted ? (
              <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <Stamp
                  label={`WAITLIST #${e.my_waitlist_pos ?? pos}`}
                  variant="pending"
                  animate={just === "waitlisted"}
                  className="text-sm sm:text-base px-3 py-1 border-[2.5px]"
                />
              </div>
            ) : status === "full" ? (
              <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <Stamp
                  label="FULL"
                  variant="declined"
                  className="text-sm sm:text-base px-3 py-1 border-[2.5px]"
                />
              </div>
            ) : null}

            {/* Department tag */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-grotesk text-xs uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-[#F2B93B] text-[#1E1A17] border border-[#1E1A17]">
                {e.department ?? "General"}
              </span>
              <Tag
                variant={status === "open" ? "teal" : status === "full" ? "red" : "mustard"}
                label={status}
              />
            </div>

            {/* Title: Heavy grotesque, letter-spacing -0.01em, line-height 0.98 */}
            <h1 className="font-grotesk text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.01em] leading-[0.98] text-[#1E1A17] my-3">
              {e.title}
            </h1>

            {/* Metadata list */}
            <dl className="mt-6 space-y-4 border-t border-[#1E1A17]/20 pt-4 text-[#1E1A17]">
              <div className="flex items-start gap-3.5">
                <CalendarClock className="size-5 shrink-0 text-[#EF4B35] mt-0.5" />
                <div>
                  <dt className="text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/60">Date & Time</dt>
                  <dd className="font-bold text-base">{fmtDay(e.starts_at)}</dd>
                  <dd className="text-sm font-semibold text-[#1E1A17]/75">{fmtRange(e.starts_at, e.ends_at)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <MapPin className="size-5 shrink-0 text-[#EF4B35] mt-0.5" />
                <div>
                  <dt className="text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/60">Location</dt>
                  <dd className="font-bold text-base">{e.venue_name ?? "Venue TBA"}</dd>
                  {e.venue_location ? (
                    <dd className="text-sm font-semibold text-[#1E1A17]/75">{e.venue_location}</dd>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <UserRound className="size-5 shrink-0 text-[#EF4B35] mt-0.5" />
                <div>
                  <dt className="text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/60">Organiser</dt>
                  <dd className="font-bold text-base">{e.coordinator_name ?? "Faculty Events Committee"}</dd>
                </div>
              </div>

              {e.capacity ? (
                <div className="flex items-start gap-3.5">
                  <Users className="size-5 shrink-0 text-[#EF4B35] mt-0.5" />
                  <div>
                    <dt className="text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/60">Attendance Capacity</dt>
                    <dd className="font-bold text-base">
                      {left === 0 ? "No seats left" : `${left} of ${e.capacity} seats remaining`}
                    </dd>
                    <dd className="text-sm font-semibold text-[#1E1A17]/75">
                      {e.confirmed ?? 0} confirmed{e.waitlisted ? ` · ${e.waitlisted} on waitlist` : ""}
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {e.description ? (
              <div className="mt-6 border-t border-[#1E1A17]/20 pt-4">
                <h3 className="font-grotesk text-sm font-extrabold uppercase tracking-wide text-[#1E1A17]/70">
                  Event Brief
                </h3>
                <p className="mt-1.5 text-sm sm:text-base font-medium leading-relaxed text-[#1E1A17]/90">
                  {e.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* REGISTRATION FORM ON A CLEAN CREAM CARD */}
          <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-6 shadow-sm space-y-5">
            <div>
              <span className="font-script text-base text-[#EF4B35] font-bold block rotate-[-1deg]">
                Student RSVP Form
              </span>
              <h2 className="font-grotesk text-xl sm:text-2xl font-black text-[#1E1A17] tracking-[-0.01em]">
                {registered ? "Seat Confirmed!" : waitlisted ? "Waitlist Status" : "Reserve Your Seat"}
              </h2>
            </div>

            {/* Status Feedback Block */}
            {just ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
                className="rounded-lg border-[1.5px] border-[#1E1A17] bg-[#B5DDD4] p-4 text-[#1E1A17]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Stamp
                    label={just.toUpperCase()}
                    variant={just === "registered" ? "registered" : "pending"}
                    className="text-xs py-0.5 px-2"
                  />
                  <p className="font-grotesk text-base font-black">
                    {just === "registered" ? "You're In!" : "Added to Waitlist"}
                  </p>
                </div>
                <p className="text-xs font-semibold mt-1">
                  {just === "registered"
                    ? "The stamp has been pressed onto your flyer. Check your Student Portal."
                    : "We'll notify you if a seat opens up."}
                </p>
                <div className="mt-3">
                  <Link
                    href="/student/my"
                    className="font-grotesk text-xs font-black uppercase tracking-wider underline underline-offset-4"
                  >
                    View My Events →
                  </Link>
                </div>
              </motion.div>
            ) : null}

            {/* Action buttons */}
            {canJoin ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1E1A17]/80">
                  Registration takes 1 click. You will receive an in-app reminder before the event starts.
                </p>
                <PrimaryButton
                  variant={full ? "mustard" : "red"}
                  size="lg"
                  className="w-full"
                  onClick={() => setConfirm("register")}
                >
                  {full ? "Join Waitlist" : "Register Now"}
                </PrimaryButton>
                {full && (
                  <p className="text-xs text-center font-bold text-[#1E1A17]/70">
                    Currently at position #{pos} on the waitlist.
                  </p>
                )}
              </div>
            ) : registered || waitlisted ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#B5DDD4]/40 border border-[#1E1A17]/30 rounded-lg text-xs font-semibold">
                  You are currently marked as <strong>{registered ? "Registered" : "Waitlisted"}</strong> for this noticeboard event.
                </div>
                <PrimaryButton
                  variant="cream"
                  size="md"
                  className="w-full"
                  onClick={() => setConfirm("cancel")}
                >
                  Cancel Registration
                </PrimaryButton>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-[#1E1A17]/20 bg-[#F4EFE3] p-4 text-sm font-semibold text-[#1E1A17]/80">
                <Info className="size-5 shrink-0 text-[#EF4B35]" />
                <span>Registration is currently closed for this event.</span>
              </div>
            )}

            {/* Noticeboard details helper */}
            <div className="border-t border-[#1E1A17]/15 pt-4 text-xs font-semibold text-[#1E1A17]/70 space-y-1">
              <p>• College ID is required at the hall door.</p>
              <p>• Seats are released if not claimed 10 minutes prior.</p>
            </div>
          </div>
        </div>
      </BoardSection>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirm === "register"}
        verb={full ? "join the waitlist" : "register"}
        summary={summary}
        consequence={
          full
            ? `You will be added to the waitlist at position ${pos}.`
            : "Your seat is confirmed immediately."
        }
        confirmLabel={full ? "Join Waitlist" : "Confirm Registration"}
        onConfirm={register}
        onCancel={() => setConfirm(null)}
      >
        {overlap ? (
          <p
            role="status"
            className="mt-4 flex gap-2 rounded-lg border border-[#EF4B35] bg-[#FDE9E6] p-3 text-sm font-bold text-[#EF4B35]"
          >
            <TriangleAlert className="size-4 shrink-0 mt-0.5" />
            This event clashes with “{overlap.title}”.
          </p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "cancel"}
        verb="cancel"
        destructive
        summary={summary}
        consequence="Your seat will be released to the next person on the waitlist."
        confirmLabel="Confirm Cancel"
        onConfirm={cancel}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
