"use client";

import { motion } from "motion/react";
import {
  CalendarClock,
  ChevronLeft,
  ExternalLink,
  Globe,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { BoardSection } from "@/components/board/BoardSection";
import { Tape } from "@/components/board/Tape";
import { Tag } from "@/components/board/Tag";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { fmtDay, fmtRange } from "@/lib/format";
import { eventStatus, seatsLeft } from "@/lib/status";
import { getEventLink } from "@/lib/eventLinks";
import type { EventItem } from "@/lib/types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: e, error } = useSWR<EventItem>(`/api/events/${id}`);

  const unstopLink = getEventLink({ id, title: e?.title });

  if (error || (!e && id.startsWith("fb-"))) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] px-4 py-8 max-w-4xl mx-auto">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 font-grotesk text-sm font-bold text-[#1E1A17] mb-6"
        >
          <ChevronLeft className="size-4" /> Back to Noticeboard
        </Link>
        <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-8 shadow-[4px_6px_0px_rgba(30,26,23,0.18)] text-center">
          <span className="font-script text-lg font-bold text-[#EF4B35] block rotate-[-2deg]">
            ★ External Registration Flyer
          </span>
          <h2 className="font-grotesk text-2xl sm:text-3xl font-black text-[#1E1A17] mt-1">
            Official Event Registration
          </h2>
          <p className="mt-3 text-sm font-semibold text-[#1E1A17]/80 max-w-lg mx-auto">
            This Crescendo event is registered directly through Unstop. Click below to view competition rules, rounds, and grab your team pass.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {unstopLink && (
              <a
                href={unstopLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] text-white py-2.5 px-5 font-grotesk text-sm font-bold shadow-[2px_2px_0px_#1E1A17] hover:bg-[#DB3D28] transition-colors"
              >
                Register on Unstop ↗
              </a>
            )}
            <PrimaryButton href="/events" size="sm" variant="cream">
              Back to Events Board
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  if (!e) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] px-4 py-8 max-w-5xl mx-auto space-y-4">
        <div className="rounded-xl border border-[#1E1A17]/20 bg-[#D9CBB3]/40 p-12 text-center">
          <p className="font-grotesk text-lg font-bold text-[#1E1A17]">Loading Noticeboard Flyer...</p>
        </div>
      </div>
    );
  }

  const status = eventStatus(e);
  const left = seatsLeft(e);

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
          Organised by {e.coordinator_name ?? e.department ?? "Fr. CRCE"}
        </span>
      </div>

      {/* Main Noticeboard BoardSection */}
      <BoardSection title="Official Notice" sub="Event Details & Unstop Link">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-start">
          {/* ONE LARGE FLYER ON THE BOARD */}
          <div className="relative rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-6 sm:p-8 shadow-[3px_6px_16px_rgba(30,26,23,0.12)] rotate-[-0.75deg]">
            <Tape position="top" />

            {/* Department and Type tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-grotesk text-xs uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-[#F2B93B] text-[#1E1A17] border border-[#1E1A17]">
                {e.coordinator_name ?? e.department ?? "College-Wide"}
              </span>
              {e.type ? (
                <span className="font-grotesk text-xs uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-[#D9CBB3] text-[#1E1A17] border border-[#1E1A17]">
                  {e.type}
                </span>
              ) : null}
              <Tag
                variant={status === "open" ? "teal" : status === "full" ? "red" : "mustard"}
                label={status}
              />
            </div>

            {/* Title */}
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
                    <dt className="text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/60">Capacity</dt>
                    <dd className="font-bold text-base">
                      {e.capacity} participants
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

          {/* OFFICIAL REGISTRATION CARD */}
          <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-6 shadow-sm space-y-5">
            <div>
              <span className="font-script text-base text-[#EF4B35] font-bold block rotate-[-1deg]">
                Official Fest Entry
              </span>
              <h2 className="font-grotesk text-xl sm:text-2xl font-black text-[#1E1A17] tracking-[-0.01em]">
                Unstop Registration
              </h2>
            </div>

            <p className="text-sm font-semibold text-[#1E1A17]/80 leading-relaxed">
              Registrations, team slots, and problem statements for this event are hosted exclusively on Unstop. No local registration is needed.
            </p>

            {unstopLink ? (
              <div className="space-y-3">
                <a
                  href={unstopLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] text-white py-3 px-5 font-grotesk text-sm font-bold shadow-[2px_2px_0px_#1E1A17] hover:bg-[#DB3D28] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  Register on Unstop <ExternalLink className="size-4" />
                </a>
                <p className="text-xs text-center font-semibold text-[#1E1A17]/70">
                  Opens official Unstop listing in a new tab.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#F2B93B]/30 border border-[#1E1A17]/20 rounded-lg text-xs font-semibold text-[#1E1A17]/80">
                Official Unstop link is coming soon for this event.
              </div>
            )}

            <div className="border-t border-[#1E1A17]/15 pt-4 text-xs font-semibold text-[#1E1A17]/70 space-y-1">
              <p>• Verified for Crescendo 2026.</p>
              <p>• College ID is required at the hall door.</p>
            </div>
          </div>
        </div>
      </BoardSection>
    </div>
  );
}
