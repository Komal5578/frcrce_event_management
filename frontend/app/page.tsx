"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Nav } from "@/components/board/Nav";
import { BoardSection } from "@/components/board/BoardSection";
import { Flyer, type FlyerColor } from "@/components/board/Flyer";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { fmtDay, fmtRange } from "@/lib/format";
import { seatsLeft } from "@/lib/status";
import type { EventItem } from "@/lib/types";

// Seeded fallback noticeboard flyers if API events are still loading or empty
const SAMPLE_FLYERS = [
  {
    id: "sample-1",
    title: "Crescendo Annual Cultural Night",
    date: "Fri, 30 Oct",
    time: "5:30 PM – 10:00 PM",
    room: "College Main Auditorium",
    seatsLeft: 42,
    capacity: 250,
    department: "Student Council",
    colorVariant: "red" as FlyerColor,
    tiltDegree: -1.5,
    stamp: { text: "APPROVED", variant: "approved" as const },
    annotation: "Biggest fest of the year!",
  },
  {
    id: "sample-2",
    title: "HackCRCE 24-Hour Code Sprint",
    date: "Sat, 7 Nov",
    time: "9:00 AM onwards",
    room: "Lab 401 & 402, IT Block",
    seatsLeft: 8,
    capacity: 60,
    department: "Computer",
    colorVariant: "mustard" as FlyerColor,
    tiltDegree: 2,
    stamp: { text: "FILLING FAST", variant: "pending" as const },
    annotation: "Free pizza at 2 AM 🍕",
  },
  {
    id: "sample-3",
    title: "AI & Neural Nets Hands-On Workshop",
    date: "Wed, 11 Nov",
    time: "2:00 PM – 5:00 PM",
    room: "Seminar Hall 2",
    seatsLeft: 19,
    capacity: 80,
    department: "AI & DS",
    colorVariant: "teal" as FlyerColor,
    tiltDegree: -2,
    stamp: { text: "OPEN", variant: "approved" as const },
  },
  {
    id: "sample-4",
    title: "Formula Student Electric Chassis Review",
    date: "Mon, 16 Nov",
    time: "11:00 AM – 1:00 PM",
    room: "Mechanical Workshop",
    seatsLeft: 0,
    capacity: 40,
    department: "Mechanical",
    colorVariant: "cream" as FlyerColor,
    tiltDegree: 1.5,
    stamp: { text: "WAITLIST", variant: "declined" as const },
  },
  {
    id: "sample-5",
    title: "Inter-Collegiate Debate Championship",
    date: "Thu, 19 Nov",
    time: "10:00 AM – 4:00 PM",
    room: "Audio-Visual Hall",
    seatsLeft: 35,
    capacity: 100,
    department: "Humanities",
    colorVariant: "teal" as FlyerColor,
    tiltDegree: -1,
  },
  {
    id: "sample-6",
    title: "Robotics Club Sumo-Bot Challenge",
    date: "Sat, 21 Nov",
    time: "1:00 PM – 6:00 PM",
    room: "Open Quadrangle",
    seatsLeft: 14,
    capacity: 50,
    department: "Electronics",
    colorVariant: "mustard" as FlyerColor,
    tiltDegree: 2.5,
  },
];

export default function LandingPage() {
  const { data: events } = useSWR<EventItem[]>("/api/events");

  // Format real API events or fall back to samples
  const displayFlyers = useMemo(() => {
    if (events && events.length > 0) {
      const palette: FlyerColor[] = ["mustard", "teal", "red", "cream"];
      const tilts = [-1.5, 2, -2, 1.5, -1, 2.5];
      return events.slice(0, 6).map((e, idx) => ({
        id: e.id,
        title: e.title,
        date: fmtDay(e.starts_at),
        time: fmtRange(e.starts_at, e.ends_at),
        room: e.venue_name ?? "Room TBA",
        seatsLeft: seatsLeft(e),
        capacity: e.capacity,
        department: e.department ?? "College",
        colorVariant: palette[idx % palette.length],
        tiltDegree: tilts[idx % tilts.length],
        stamp:
          e.status === "open"
            ? { text: "OPEN", variant: "approved" as const }
            : e.status === "full"
            ? { text: "FULL", variant: "declined" as const }
            : null,
        href: `/student/events/${e.id}`,
      }));
    }
    return SAMPLE_FLYERS.map((f) => ({
      ...f,
      href: "/events",
    }));
  }, [events]);

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex flex-col">
      <Nav />

      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
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
          <p className="mt-4 sm:mt-5 text-lg sm:text-xl font-medium text-[#1E1A17]/85 max-w-2xl leading-relaxed">
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
            <span className="font-script text-base sm:text-lg text-[#1E1A17]/70 rotate-[3deg] ml-2">
              (No more scrolling 500 WhatsApp messages ↑)
            </span>
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
          {/* Staggered Grid of Flyers:
              Re-laid in a staggered layout so EVERY flyer's title, date, time,
              room and seats left are fully visible!
              Verified at 1440px (3 cols), 1024px (2-3 cols), 768px (2 cols), 390px (1 col).
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pt-2 pb-6">
            {displayFlyers.map((flyer, idx) => (
              <div
                key={flyer.id}
                className={idx % 2 === 1 ? "md:translate-y-4" : ""}
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
                  href={flyer.href}
                  actionText="View flyer →"
                />
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
          <p className="font-script text-base text-[#1E1A17]/80">
            Keep campus lively. Pinned notices cleared weekly.
          </p>
          <p className="text-xs text-[#1E1A17]/60">
            Fr. Conceicao Rodrigues College of Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}
