"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Nav } from "@/components/board/Nav";
import { BoardSection, type TabLabel } from "@/components/board/BoardSection";
import { CouncilLadder } from "@/components/board/CouncilLadder";
import { Flyer, type FlyerColor } from "@/components/board/Flyer";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { Search, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { fmtDay, fmtRange } from "@/lib/format";
import { seatsLeft } from "@/lib/status";
import { getEventLink } from "@/lib/eventLinks";
import { cn } from "@/lib/cn";
import type { EventItem } from "@/lib/types";

const FALLBACK_EVENTS: {
  id: string;
  title: string;
  type?: string;
  date: string;
  time: string;
  room: string;
  seatsLeft: number | null;
  capacity: number;
  department: string;
  colorVariant: FlyerColor;
  tiltDegree: number;
  stamp?: { text: string; variant?: "registered" | "approved" | "declined" | "pending"; animate?: boolean };
}[] = [
  {
    id: "fb-1",
    title: "Crescendo: OHM MY GOD!",
    type: "competition",
    date: "Fri, 30 Oct",
    time: "10:00 AM – 4:00 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 28,
    capacity: 60,
    department: "IEEE CRCE",
    colorVariant: "red",
    tiltDegree: -1.5,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-2",
    title: "Crescendo: Formula Unicorn 2026",
    type: "competition",
    date: "Thu, 29 Oct",
    time: "10:00 AM – 3:00 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 14,
    capacity: 90,
    department: "eCell CRCE",
    colorVariant: "mustard",
    tiltDegree: 2,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-3",
    title: "Crescendo: Agnirakshak - Autonomous Bot Challenge",
    type: "competition",
    date: "Thu, 29 Oct",
    time: "10:45 AM – 3:45 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 6,
    capacity: 48,
    department: "Robix CRCE",
    colorVariant: "teal",
    tiltDegree: -2,
    stamp: { text: "FILLING FAST", variant: "pending" },
  },
  {
    id: "fb-4",
    title: "Crescendo: Synergy 2026 Hardware Hackathon",
    type: "competition",
    date: "Sun, 1 Nov",
    time: "9:00 AM – 8:00 PM",
    room: "Fr. CRCE Campus (Room TBA)",
    seatsLeft: 18,
    capacity: 80,
    department: "Student Council",
    colorVariant: "cream",
    tiltDegree: 1.5,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-5",
    title: "Crescendo: Escape Room Coding Sprint",
    type: "competition",
    date: "Fri, 30 Oct",
    time: "9:00 AM – 4:00 PM",
    room: "Labs 601-604",
    seatsLeft: 12,
    capacity: 80,
    department: "CodeStorm",
    colorVariant: "mustard",
    tiltDegree: -1,
  },
  {
    id: "fb-6",
    title: "Crescendo: Robowars Combat Robotics",
    type: "competition",
    date: "Fri, 30 Oct",
    time: "10:00 AM – 6:00 PM",
    room: "Campus Arena (Room TBA)",
    seatsLeft: 22,
    capacity: 80,
    department: "Rotaract CRCE",
    colorVariant: "teal",
    tiltDegree: 2.2,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-7",
    title: "GDG CRCE: Bit-n-Build Hackathon",
    type: "competition",
    date: "Sat, 31 Oct",
    time: "10:00 AM – 5:00 PM",
    room: "Fr. CRCE Campus",
    seatsLeft: 30,
    capacity: 80,
    department: "GDG CRCE",
    colorVariant: "red",
    tiltDegree: -2.5,
    stamp: { text: "OPEN", variant: "approved" },
  },
  {
    id: "fb-8",
    title: "Conceicao Rodrigues Memorial Debate (CRMD)",
    type: "competition",
    date: "Fri, 6 Nov",
    time: "10:00 AM – 2:00 PM",
    room: "Main Auditorium",
    seatsLeft: 85,
    capacity: 300,
    department: "Student Council",
    colorVariant: "cream",
    tiltDegree: 1.8,
  },
];

const QUICK_FILTERS = [
  { id: "all", label: "All Types" },
  { id: "competition", label: "Competitions" },
  { id: "esports", label: "Esports" },
  { id: "workshop", label: "Workshops" },
  { id: "lecture", label: "Lectures & Talks" },
  { id: "sports", label: "Sports" },
  { id: "service", label: "Social Drives" },
];

export default function EventsPage() {
  const { data: apiEvents, error, mutate, isLoading } = useSWR<EventItem[]>("/api/events");
  const [activeDept, setActiveDept] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Normalize events list
  const allEvents = useMemo(() => {
    if (apiEvents && apiEvents.length > 0) {
      const palette: FlyerColor[] = ["mustard", "teal", "red", "cream"];
      const tilts = [-1.5, 2, -2, 1.5, -1, 2.2, -2.5, 1.8];
      return apiEvents.map((e, idx) => {
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
          type: e.type ?? "general",
          date: fmtDay(e.starts_at),
          time: fmtRange(e.starts_at, e.ends_at),
          room: e.venue_name ?? "Room TBA",
          seatsLeft: seatsLeft(e),
          capacity: e.capacity ?? 50,
          department: e.department ?? e.coordinator_name ?? "College-Wide",
          colorVariant: palette[idx % palette.length],
          tiltDegree: tilts[idx % tilts.length],
          stamp,
          unstopUrl,
          actionText: unstopUrl ? "Register on Unstop ↗" : "Link coming soon",
        };
      });
    }

    return FALLBACK_EVENTS.map((f) => {
      const unstopUrl = getEventLink(f);
      const isOpening = openingId === f.id;
      let stamp = f.stamp;
      if (isOpening) {
        stamp = { text: "OPENING UNSTOP", variant: "approved" as const, animate: true };
      } else if (!unstopUrl) {
        stamp = { text: "COMING SOON", variant: "pending" as const };
      }

      return {
        ...f,
        type: f.type ?? "competition",
        stamp,
        unstopUrl,
        actionText: unstopUrl ? "Register on Unstop ↗" : "Link coming soon",
      };
    });
  }, [apiEvents, openingId]);

  // Extract distinct departments for tabs
  const tabs: TabLabel[] = useMemo(() => {
    const counts = new Map<string, number>();
    allEvents.forEach((e) => {
      counts.set(e.department, (counts.get(e.department) ?? 0) + 1);
    });
    const list: TabLabel[] = [{ id: "all", label: "All Events", count: allEvents.length }];
    counts.forEach((count, dept) => {
      list.push({ id: dept, label: dept, count });
    });
    return list;
  }, [allEvents]);

  // Split councils in two halves for left & right continuous scrolling ladders
  const { leftCouncils, rightCouncils } = useMemo(() => {
    const councils = tabs.filter((t) => t.id !== "all");
    const half = Math.ceil(councils.length / 2);
    return {
      leftCouncils: councils.slice(0, half),
      rightCouncils: councils.slice(half),
    };
  }, [tabs]);

  const handleDeptClick = (deptId: string) => {
    if (activeDept === deptId) {
      setActiveDept("all");
    } else {
      setActiveDept(deptId);
    }
  };

  // Determine flip status:
  // Non-matching flyers flip face down instead of disappearing!
  const processedEvents = useMemo(() => {
    return allEvents.map((event) => {
      const matchesDept = activeDept === "all" || event.department === activeDept;
      const matchesType = activeType === "all" || (event.type && event.type.toLowerCase() === activeType.toLowerCase());
      const matchesSearch =
        !search ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.room.toLowerCase().includes(search.toLowerCase());

      const isFlipped = !matchesDept || !matchesType || !matchesSearch;

      return {
        ...event,
        isFlipped,
      };
    });
  }, [allEvents, activeDept, activeType, search]);

  const visibleCount = processedEvents.filter((e) => !e.isFlipped).length;

  const handleCardClick = (flyerId: string, link: string | null) => {
    if (!link) return;
    setOpeningId(flyerId);
    setTimeout(() => {
      window.open(link, "_blank", "noopener,noreferrer");
      setTimeout(() => setOpeningId((curr) => (curr === flyerId ? null : curr)), 1200);
    }, 280);
  };

  // Pinned top headers for the two ladders
  const isAllActive = activeDept === "all";
  const leftPinnedHeader = (
    <button
      type="button"
      role="tab"
      aria-pressed={isAllActive}
      onClick={() => setActiveDept("all")}
      className={cn(
        "group/pinned relative z-20 w-full rounded-lg border-[1.5px] px-3 py-2 text-left font-grotesk text-xs uppercase tracking-wide font-black transition-all duration-100 ease-out cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-[#1E1A17] focus-visible:outline-offset-1",
        "flex items-center justify-between gap-1.5",
        isAllActive
          ? "bg-[#EF4B35] text-[#F4EFE3] border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] translate-x-[6px]"
          : "bg-[#E8DFC8] text-[#1E1A17] border-[#1E1A17] hover:bg-[#D9CBB3] hover:shadow-[2px_2px_0px_rgba(30,26,23,0.3)] shadow-[1px_1px_0px_rgba(30,26,23,0.25)]"
      )}
    >
      <span className="truncate">ALL EVENTS</span>
      <span
        className={cn(
          "shrink-0 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded",
          isAllActive
            ? "bg-[#1E1A17] text-[#F4EFE3]"
            : "bg-[#1E1A17]/10 text-[#1E1A17]"
        )}
      >
        {allEvents.length}
      </span>
    </button>
  );

  const rightPinnedHeader = (
    <div className="relative z-20 w-full rounded-lg border-[1.5px] border-[#1E1A17] bg-[#E8DFC8] px-3 py-2 text-center font-grotesk text-xs uppercase tracking-wider font-extrabold text-[#1E1A17]/80 shadow-[1px_1px_0px_rgba(30,26,23,0.25)]">
      CLUBS & CELLS 📌
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex flex-col">
      <Nav />

      <main className="px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-[94rem] mx-auto w-full flex-1">
        {/* Page Title & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-script text-base sm:text-lg font-bold text-[#EF4B35] rotate-[-2deg]">
                ★ Click any flyer to register directly on Unstop
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

        {/* Quick Category Filter Chips: reacts immediately */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <span className="font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/70 shrink-0 mr-1">
            Category:
          </span>
          {QUICK_FILTERS.map((f) => {
            const on = activeType === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveType(f.id)}
                className={cn(
                  "cursor-pointer shrink-0 rounded-lg border-[1.5px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider font-grotesk transition-all duration-150 active:scale-95 shadow-sm",
                  on
                    ? "border-[#1E1A17] bg-[#EF4B35] text-white shadow-[2px_2px_0px_#1E1A17]"
                    : "border-[#1E1A17]/35 bg-white text-[#1E1A17] hover:border-[#1E1A17] hover:bg-[#F4EFE3]"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Below 1024px: Single horizontal scrolling row of council tabs */}
        <div className="lg:hidden mb-6 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          <span className="font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/70 shrink-0 mr-1">
            Council:
          </span>
          {tabs.map((tab) => {
            const isActive = activeDept === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-pressed={isActive}
                onClick={() => handleDeptClick(tab.id)}
                className={cn(
                  "cursor-pointer shrink-0 rounded-lg border-[1.5px] border-[#1E1A17] px-3.5 py-1.5 text-xs font-bold font-grotesk uppercase tracking-wide transition-all",
                  "focus-visible:outline-2 focus-visible:outline-[#1E1A17]",
                  isActive
                    ? "bg-[#EF4B35] text-[#F4EFE3] shadow-[2px_2px_0px_#1E1A17]"
                    : "bg-[#E8DFC8] text-[#1E1A17] hover:bg-[#D9CBB3]"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1.5 opacity-70">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Visible Error State if backend unreachable */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border-[1.5px] border-[#EF4B35] bg-[#FDE9E6] text-[#1E1A17] flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-[#EF4B35] shrink-0" />
              <div>
                <p className="font-grotesk text-sm font-bold text-[#EF4B35]">
                  Noticeboard backend temporarily unreachable
                </p>
                <p className="text-xs font-semibold text-[#1E1A17]/80">
                  Showing preserved local notices. You can still browse and open Unstop registration links!
                </p>
              </div>
            </div>
            <button
              onClick={() => mutate()}
              className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E1A17] bg-white text-xs font-bold hover:bg-[#F4EFE3] transition-colors"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          </div>
        )}

        {/* 3-Column Desktop Layout: [Left Ladder] [Noticeboard] [Right Ladder] */}
        <div className="grid grid-cols-1 lg:grid-cols-[12rem_1fr_12rem] xl:grid-cols-[13.5rem_1fr_13.5rem] 2xl:grid-cols-[15rem_1fr_15rem] gap-4 lg:gap-6 items-start">
          {/* Left Ladder: Continuous Upward Scroll */}
          <div className="hidden lg:block sticky top-24">
            <CouncilLadder
              councils={leftCouncils}
              activeDept={activeDept}
              onSelectDept={handleDeptClick}
              direction="up"
              side="left"
              pinnedHeader={leftPinnedHeader}
            />
          </div>

          {/* Center Noticeboard: Clean full height with no squashed tabs on top */}
          <div className="min-w-0">
            <BoardSection>
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
                  Click any flyer to open Unstop registration 📌
                </span>
              </div>

              {/* Staggered board grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 pt-2 pb-6">
                {processedEvents.map((flyer, idx) => (
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
                        isFlipped={flyer.isFlipped}
                        stamp={flyer.stamp}
                        actionText={flyer.actionText}
                      />
                    </a>
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
                        setActiveType("all");
                        setSearch("");
                      }}
                    >
                      Flip All Face Up
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </BoardSection>
          </div>

          {/* Right Ladder: Continuous Downward Scroll */}
          <div className="hidden lg:block sticky top-24">
            <CouncilLadder
              councils={rightCouncils}
              activeDept={activeDept}
              onSelectDept={handleDeptClick}
              direction="down"
              side="right"
              pinnedHeader={rightPinnedHeader}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

