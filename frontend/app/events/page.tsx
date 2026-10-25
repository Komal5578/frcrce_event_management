"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Nav } from "@/components/board/Nav";
import { BoardSection, type TabLabel } from "@/components/board/BoardSection";
import { Flyer, type FlyerColor } from "@/components/board/Flyer";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { Search, Sparkles } from "lucide-react";
import { fmtDay, fmtRange } from "@/lib/format";
import { seatsLeft } from "@/lib/status";
import type { EventItem } from "@/lib/types";

const FALLBACK_EVENTS: {
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
  stamp?: { text: string; variant?: "registered" | "approved" | "declined" | "pending" };
}[] = [
  {
    id: "fb-1",
    title: "Crescendo Annual Cultural Night",
    date: "Fri, 30 Oct",
    time: "5:30 PM – 10:00 PM",
    room: "College Main Auditorium",
    seatsLeft: 42,
    capacity: 250,
    department: "Student Council",
    colorVariant: "red",
    tiltDegree: -1.5,
    stamp: { text: "APPROVED", variant: "approved" },
  },
  {
    id: "fb-2",
    title: "HackCRCE 24-Hour Code Sprint",
    date: "Sat, 7 Nov",
    time: "9:00 AM onwards",
    room: "Lab 401 & 402, IT Block",
    seatsLeft: 8,
    capacity: 60,
    department: "Computer",
    colorVariant: "mustard",
    tiltDegree: 2,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-3",
    title: "AI & Neural Nets Hands-On Workshop",
    date: "Wed, 11 Nov",
    time: "2:00 PM – 5:00 PM",
    room: "Seminar Hall 2",
    seatsLeft: 19,
    capacity: 80,
    department: "AI & DS",
    colorVariant: "teal",
    tiltDegree: -2,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-4",
    title: "Formula Student Electric Chassis Review",
    date: "Mon, 16 Nov",
    time: "11:00 AM – 1:00 PM",
    room: "Mechanical Workshop",
    seatsLeft: 0,
    capacity: 40,
    department: "Mechanical",
    colorVariant: "cream",
    tiltDegree: 1.5,
    stamp: { text: "FULL", variant: "declined" },
  },
  {
    id: "fb-5",
    title: "Web3 & Smart Contracts Masterclass",
    date: "Thu, 19 Nov",
    time: "3:00 PM – 6:00 PM",
    room: "Computer Lab 3",
    seatsLeft: 12,
    capacity: 45,
    department: "IT",
    colorVariant: "mustard",
    tiltDegree: -1,
  },
  {
    id: "fb-6",
    title: "Annual Sports Meet: Track & Field",
    date: "Fri, 27 Nov",
    time: "8:00 AM – 4:00 PM",
    room: "College Sports Grounds",
    seatsLeft: 65,
    capacity: 200,
    department: "Student Council",
    colorVariant: "teal",
    tiltDegree: 2.2,
  },
  {
    id: "fb-7",
    title: "Mechatronics & Drone Aerodynamics",
    date: "Tue, 1 Dec",
    time: "10:30 AM – 1:30 PM",
    room: "Aero Lab 102",
    seatsLeft: 16,
    capacity: 50,
    department: "Mechanical",
    colorVariant: "red",
    tiltDegree: -2.5,
  },
  {
    id: "fb-8",
    title: "Open Source Contribution Sprint",
    date: "Sat, 5 Dec",
    time: "10:00 AM – 4:00 PM",
    room: "Central Computing Facility",
    seatsLeft: 25,
    capacity: 70,
    department: "Computer",
    colorVariant: "cream",
    tiltDegree: 1.8,
  },
];

export default function EventsPage() {
  const { data: apiEvents } = useSWR<EventItem[]>("/api/events");
  const [activeDept, setActiveDept] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Normalize events list
  const allEvents = useMemo(() => {
    if (apiEvents && apiEvents.length > 0) {
      const palette: FlyerColor[] = ["mustard", "teal", "red", "cream"];
      const tilts = [-1.5, 2, -2, 1.5, -1, 2.2, -2.5, 1.8];
      return apiEvents.map((e, idx) => ({
        id: e.id,
        title: e.title,
        date: fmtDay(e.starts_at),
        time: fmtRange(e.starts_at, e.ends_at),
        room: e.venue_name ?? "Room TBA",
        seatsLeft: seatsLeft(e),
        capacity: e.capacity ?? 50,
        department: e.department ?? "General",
        colorVariant: palette[idx % palette.length],
        tiltDegree: tilts[idx % tilts.length],
        stamp:
          e.status === "open"
            ? { text: "OPEN", variant: "approved" as const }
            : e.status === "full"
            ? { text: "FULL", variant: "declined" as const }
            : null,
      }));
    }
    return FALLBACK_EVENTS;
  }, [apiEvents]);

  // Extract distinct departments for tabs
  const tabs: TabLabel[] = useMemo(() => {
    const counts = new Map<string, number>();
    allEvents.forEach((e) => {
      counts.set(e.department, (counts.get(e.department) ?? 0) + 1);
    });
    const list: TabLabel[] = [{ id: "all", label: "All Departments", count: allEvents.length }];
    counts.forEach((count, dept) => {
      list.push({ id: dept, label: dept, count });
    });
    return list;
  }, [allEvents]);

  // Determine flip status:
  // Non-matching flyers flip face down instead of disappearing!
  const processedEvents = useMemo(() => {
    return allEvents.map((event) => {
      const matchesDept = activeDept === "all" || event.department === activeDept;
      const matchesSearch =
        !search ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.room.toLowerCase().includes(search.toLowerCase());
      
      const isFlipped = !matchesDept || !matchesSearch;

      return {
        ...event,
        isFlipped,
      };
    });
  }, [allEvents, activeDept, search]);

  const visibleCount = processedEvents.filter((e) => !e.isFlipped).length;

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex flex-col">
      <Nav />

      <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto w-full flex-1">
        {/* Page Title & Search Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-script text-base sm:text-lg font-bold text-[#EF4B35] rotate-[-2deg]">
                ★ Grab your seat before registration closes!
              </span>
            </div>
            <h1 className="font-grotesk text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.01em] leading-[0.98] text-[#1E1A17]">
              College Events Board
            </h1>
            <p className="mt-2 text-base font-semibold text-[#1E1A17]/70">
              Department filters flip non-matching flyers face down on the board.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#1E1A17]/60" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or hall..."
              className="w-full rounded-lg border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E1A17]"
            />
          </div>
        </div>

        {/* Noticeboard with Edge Tab Labels */}
        <BoardSection
          tabs={tabs}
          activeTab={activeDept}
          onTabChange={(tabId) => setActiveDept(tabId)}
        >
          {/* Header row inside board */}
          <div className="mb-6 flex items-center justify-between border-b border-[#1E1A17]/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-grotesk text-xs uppercase tracking-widest font-extrabold text-[#1E1A17]/80">
                Active Notices:
              </span>
              <span className="font-grotesk text-xs font-black bg-[#EF4B35] text-white px-2 py-0.5 rounded border border-[#1E1A17]">
                {visibleCount} Face Up / {processedEvents.length - visibleCount} Face Down
              </span>
            </div>

            <span className="font-script text-sm sm:text-base text-[#1E1A17]/75 hidden sm:inline rotate-[-1deg]">
              Click any flyer to view details & RSVP 📌
            </span>
          </div>

          {/* Staggered board grid:
              Re-laid in a staggered layout so EVERY flyer's title, date, time,
              room and seats left are fully visible!
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pt-2 pb-6">
            {processedEvents.map((flyer, idx) => (
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
                  isFlipped={flyer.isFlipped}
                  stamp={flyer.stamp}
                  href={`/student/events/${flyer.id}`}
                  actionText="View & Register →"
                />
              </div>
            ))}
          </div>

          {/* Empty state: Cheeky message when all face down */}
          {visibleCount === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-[#1E1A17]/30 rounded-xl bg-[#F4EFE3]/50 my-6">
              <p className="font-grotesk text-2xl font-black text-[#1E1A17]">
                Nothing pinned yet. Take a break! ☕
              </p>
              <p className="font-script text-lg text-[#EF4B35] mt-1">
                All flyers are flipped face down for this filter.
              </p>
              <div className="mt-4">
                <PrimaryButton
                  size="sm"
                  variant="mustard"
                  onClick={() => {
                    setActiveDept("all");
                    setSearch("");
                  }}
                >
                  Flip All Face Up
                </PrimaryButton>
              </div>
            </div>
          )}
        </BoardSection>
      </main>
    </div>
  );
}
