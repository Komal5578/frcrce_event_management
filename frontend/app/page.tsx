"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Nav } from "@/components/board/Nav";
import { BoardSection } from "@/components/board/BoardSection";
import { Flyer, type FlyerColor } from "@/components/board/Flyer";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { Tape } from "@/components/board/Tape";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import { fmtDay, fmtRange } from "@/lib/format";
import { seatsLeft } from "@/lib/status";
import { getEventLink } from "@/lib/eventLinks";
import type { EventItem } from "@/lib/types";
import { filterCrescendoEvents } from "@/lib/crescendo-events";

// Seeded fallback noticeboard flyers if API events are still loading or empty
const SAMPLE_FLYERS: {
  id: string;
  title: string;
  date: string;
  time: string;
  room: string;
  seatsLeft: number | null;
  capacity: number;
  department: string;
  colorVariant: FlyerColor;
  tiltDegree: number;
  stamp?: { text: string; variant?: "registered" | "approved" | "declined" | "pending"; animate?: boolean } | null;
  annotation?: string;
}[] = [
  {
    id: "sample-1",
    title: "Crescendo: OHM MY GOD!",
    date: "Fri, 30 Oct",
    time: "10:00 AM – 4:00 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 28,
    capacity: 60,
    department: "IEEE CRCE",
    colorVariant: "red" as FlyerColor,
    tiltDegree: -1.5,
    stamp: { text: "APPROVED", variant: "approved" as const },
    annotation: "Flagship fest competition!",
  },
  {
    id: "sample-2",
    title: "Crescendo: Formula Unicorn 2026",
    date: "Thu, 29 Oct",
    time: "10:00 AM – 3:00 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 14,
    capacity: 90,
    department: "eCell CRCE",
    colorVariant: "mustard" as FlyerColor,
    tiltDegree: 2,
    stamp: { text: "FILLING FAST", variant: "pending" as const },
    annotation: "Live company bidding ⚡",
  },
  {
    id: "sample-3",
    title: "Crescendo: Synergy 2026 Hardware Hackathon",
    date: "Sun, 1 Nov",
    time: "9:00 AM – 8:00 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 18,
    capacity: 80,
    department: "Student Council",
    colorVariant: "teal" as FlyerColor,
    tiltDegree: -2,
    stamp: { text: "OPEN", variant: "approved" as const },
  },
  {
    id: "sample-4",
    title: "GDG CRCE: Bit-n-Build Hackathon",
    date: "Sat, 31 Oct",
    time: "10:00 AM – 5:00 PM",
    room: "Fr. CRCE Campus",
    seatsLeft: 30,
    capacity: 80,
    department: "GDG CRCE",
    colorVariant: "cream" as FlyerColor,
    tiltDegree: 1.5,
    stamp: { text: "OPEN", variant: "approved" as const },
  },
  {
    id: "sample-5",
    title: "Conceicao Rodrigues Memorial Debate (CRMD)",
    date: "Fri, 6 Nov",
    time: "10:00 AM – 2:00 PM",
    room: "Main Auditorium",
    seatsLeft: 85,
    capacity: 300,
    department: "Student Council",
    colorVariant: "teal" as FlyerColor,
    tiltDegree: -1,
  },
  {
    id: "sample-6",
    title: "Crescendo: Robowars Combat Robotics",
    date: "Fri, 30 Oct",
    time: "10:00 AM – 6:00 PM",
    room: "Campus Arena (Room TBA)",
    seatsLeft: 22,
    capacity: 80,
    department: "Rotaract CRCE",
    colorVariant: "mustard" as FlyerColor,
    tiltDegree: 2.5,
  },
];

export default function LandingPage() {
  const { data: events } = useSWR<EventItem[]>("/api/events");
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Strictly display authentic Fr. CRCE Crescendo notices
  const displayFlyers = useMemo(() => {
    const activeList = filterCrescendoEvents(events);
    const palette: FlyerColor[] = ["mustard", "teal", "red", "cream"];
    const tilts = [-1.5, 2, -2, 1.5, -1, 2.5];

    return activeList.slice(0, 6).map((e, idx) => {
      const unstopUrl = getEventLink(e);
      const isOpening = openingId === e.id;
      let stamp = null;
      if (isOpening) {
        stamp = { text: "OPENING UNSTOP", variant: "approved" as const, animate: true };
      } else if (!unstopUrl) {
        stamp = { text: "COMING SOON", variant: "pending" as const };
      } else if (e.status === "open") {
        stamp = { text: "OPEN", variant: "approved" as const };
      } else if (e.status === "full") {
        stamp = { text: "FULL", variant: "declined" as const };
      }

      return {
        id: e.id,
        title: e.title,
        date: fmtDay(e.starts_at),
        time: fmtRange(e.starts_at, e.ends_at),
        room: e.venue_name ?? "Room TBA",
        seatsLeft: seatsLeft(e),
        capacity: e.capacity ?? 60,
        department: e.department ?? e.coordinator_name ?? "College-Wide",
        colorVariant: palette[idx % palette.length],
        tiltDegree: tilts[idx % tilts.length],
        stamp,
        unstopUrl,
        actionText: unstopUrl ? "Register on Unstop ↗" : "Link coming soon",
      };
    });
  }, [events, openingId]);

  const handleCardClick = (flyerId: string, link: string | null) => {
    if (!link) return;
    setOpeningId(flyerId);
    setTimeout(() => {
      window.open(link, "_blank", "noopener,noreferrer");
      setTimeout(() => setOpeningId((curr) => (curr === flyerId ? null : curr)), 1200);
    }, 280);
  };

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex flex-col">
      <Nav />

      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline & CTAs */}
          <div className="max-w-2xl">
            {/* Annotation 1: Max 3 per page */}
            <div className="inline-block mb-3">
              <span className="font-script text-lg sm:text-xl font-bold text-[#EF4B35] rotate-[-2deg] inline-flex items-center gap-1.5">
                <Sparkles className="size-4" />
                Freshly pinned on the board today
              </span>
            </div>

            {/* Headline: Heavy grotesque, letter-spacing -0.01em, line-height 0.98 */}
            <h1 className="font-grotesk text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.01em] leading-[0.98] text-[#1E1A17]">
              Every college event, from idea to attendance.
            </h1>

            {/* Subhead: Clean sans body */}
            <p className="mt-4 sm:mt-5 text-base sm:text-lg font-medium text-[#1E1A17]/85 max-w-xl leading-relaxed">
              One place to plan, approve, register and keep track, without the group chats.
            </p>

            {/* CTA Actions */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-4">
              {/* Main CTA button with hard offset shadow */}
              <PrimaryButton href="/events" size="lg" variant="red">
                Browse All Events
                <ArrowRight className="size-5" />
              </PrimaryButton>

              <Link
                href="/login"
                className="font-grotesk text-base font-bold px-5 py-3 rounded-lg border border-[#1E1A17] bg-[#F4EFE3] hover:bg-[#D9CBB3]/50 transition-colors"
              >
                Sign In to Your Dashboard
              </Link>

              {/* Annotation 2: Cheeky student annotation */}
              <span className="font-script text-base sm:text-lg text-[#1E1A17]/70 rotate-[3deg] ml-1">
                (No more scrolling 500 WhatsApp messages ↑)
              </span>
            </div>
          </div>

          {/* Right Column: Pinned Campus Photo Card */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] rounded-2xl border-[1.5px] border-[#1E1A17] bg-white p-2.5 sm:p-3 shadow-[4px_6px_0px_#1E1A17] rotate-[1.5deg] hover:rotate-0 transition-transform duration-200">
              {/* Masking tape on top */}
              <Tape position="top" />

              {/* Campus Photo */}
              <div className="relative overflow-hidden rounded-xl border border-[#1E1A17]/30 bg-[#F4EFE3]">
                <Image
                  src="/images/frcrce-campus.png"
                  alt="Fr. Conceicao Rodrigues College of Engineering Campus Building, Bandra Bandstand Mumbai"
                  width={460}
                  height={260}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>

              {/* Caption */}
              <div className="mt-2.5 px-1 flex items-center justify-between text-xs font-bold text-[#1E1A17]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="size-3.5 text-[#EF4B35] shrink-0" />
                  <span className="truncate">Fr. CRCE · Bandra Bandstand</span>
                </div>
                <span className="font-script text-sm font-semibold text-[#1E1A17]/70 shrink-0">
                  Campus View
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOTICEBOARD SECTION */}
      <main className="px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto w-full flex-1">
        <BoardSection
          title="Pinned Noticeboard"
          sub="Live Campus Feed"
          annotation="Grab your seat before it fills →"
        >
          {/* Staggered Grid of Flyers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pt-2 pb-6">
            {displayFlyers.map((flyer, idx) => (
              <div
                key={flyer.id}
                className={idx % 2 === 1 ? "md:translate-y-4" : ""}
              >
                <a
                  href={flyer.unstopUrl ?? undefined}
                  target={flyer.unstopUrl ? "_blank" : undefined}
                  rel={flyer.unstopUrl ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCardClick(flyer.id, flyer.unstopUrl);
                  }}
                  className="block focus-visible:outline-2 focus-visible:outline-[#1E1A17] rounded-lg"
                >
                  <Flyer
                    id={flyer.id}
                    title={flyer.title}
                    date={flyer.date}
                    time={flyer.time}
                    room={flyer.room}
                    seatsLeft={flyer.seatsLeft}
                    capacity={flyer.capacity}
                    department={flyer.department}
                    colorVariant={flyer.colorVariant}
                    tiltDegree={flyer.tiltDegree}
                    stamp={flyer.stamp}
                    actionText={flyer.actionText}
                  />
                </a>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[#1E1A17]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="font-grotesk text-sm font-bold text-[#1E1A17]/70">
              Want to see all department filters and active bookings?
            </p>
            <PrimaryButton href="/events" size="sm" variant="mustard">
              Open Full Noticeboard
            </PrimaryButton>
          </div>
        </BoardSection>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1E1A17]/20 bg-[#F4EFE3] py-8 px-4 sm:px-6 lg:px-8 text-center text-sm font-semibold text-[#1E1A17]/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            <strong className="text-[#1E1A17]">FrCRCE Events</strong> · Campus Noticeboard Theme
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-[#1E1A17]">
            <Link href="/events" className="hover:underline">Events</Link>
            <span>·</span>
            <Link href="/map" className="hover:underline text-[#EF4B35]">Campus Map 📍</Link>
            <span>·</span>
            <Link href="/student" className="hover:underline">Student Portal</Link>
          </div>
          <p className="text-xs text-[#1E1A17]/60">
            Fr. Conceicao Rodrigues College of Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}
