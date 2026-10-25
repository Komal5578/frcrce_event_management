"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  ExternalLink,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Search,
  Globe,
  MapPin,
} from "lucide-react";
import { BoardSection } from "@/components/board/BoardSection";
import { Flyer, type FlyerColor } from "@/components/board/Flyer";
import { Tape } from "@/components/board/Tape";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { StudentHead } from "@/components/shell/student-shell";
import { fmtDay, fmtRange } from "@/lib/format";
import { seatsLeft } from "@/lib/status";
import { getEventLink } from "@/lib/eventLinks";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/cn";
import type { EventItem } from "@/lib/types";

const CATEGORY_CHIPS = [
  { id: "all", label: "All Events" },
  { id: "competition", label: "Competitions" },
  { id: "esports", label: "Esports" },
  { id: "workshop", label: "Workshops" },
  { id: "lecture", label: "Lectures & Talks" },
];

export default function StudentPortalPage() {
  const { me } = useMe();
  const {
    data: allEvents,
    error: eventsError,
    mutate: mutateEvents,
    isLoading: loadingEvents,
  } = useSWR<EventItem[]>("/api/events");

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Open & upcoming events available to register on Unstop
  const displayEvents = useMemo(() => {
    const list = (allEvents ?? []).filter(
      (e) => e.status === "open" || e.status === "ongoing"
    );
    const palette: FlyerColor[] = ["mustard", "teal", "red", "cream"];
    const tilts = [-1.5, 2, -2, 1.5, -1, 2.2, -2.5, 1.8];

    return list.map((e, idx) => {
      const unstopUrl = getEventLink(e);
      const isOpening = openingId === e.id;
      let stamp = null;

      // Note: All registrations are on Unstop, so events are never shown as "registered" here.
      if (isOpening) {
        stamp = {
          text: "OPENING UNSTOP",
          variant: "approved" as const,
          animate: true,
        };
      } else if (!unstopUrl) {
        stamp = { text: "COMING SOON", variant: "pending" as const };
      } else if (e.status === "open") {
        stamp = { text: "OPEN", variant: "approved" as const };
      }

      const matchesCat =
        activeCategory === "all" ||
        (e.type && e.type.toLowerCase() === activeCategory.toLowerCase());
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.venue_name ?? "").toLowerCase().includes(search.toLowerCase());

      return {
        id: e.id,
        title: e.title,
        type: e.type ?? "competition",
        date: fmtDay(e.starts_at),
        time: fmtRange(e.starts_at, e.ends_at),
        room: e.venue_name ?? "Room TBA",
        seatsLeft: seatsLeft(e),
        capacity: e.capacity,
        department: e.department ?? e.coordinator_name ?? "College-Wide",
        colorVariant: palette[idx % palette.length],
        tiltDegree: tilts[idx % tilts.length],
        stamp,
        unstopUrl,
        isFlipped: !matchesCat || !matchesSearch,
        actionText: unstopUrl ? "Register on Unstop ↗" : "Link coming soon",
      };
    });
  }, [allEvents, openingId, activeCategory, search]);

  const visibleCount = displayEvents.filter((e) => !e.isFlipped).length;

  const handleCardClick = (flyerId: string, link: string | null) => {
    if (!link) return;
    setOpeningId(flyerId);
    setTimeout(() => {
      window.open(link, "_blank", "noopener,noreferrer");
      setTimeout(
        () => setOpeningId((curr) => (curr === flyerId ? null : curr)),
        1200
      );
    }, 280);
  };

  const firstName = me?.name ? me.name.split(" ")[0] : "Student";

  return (
    <>
      <StudentHead
        title="Student Portal & Desk"
        sub={`Welcome back, ${firstName}! Browse active campus fests and register directly on Unstop.`}
        name={me?.name}
      >
        <div className="mt-3 flex items-center gap-2">
          <span className="font-script text-base text-[#F4EFE3]/90 rotate-[-1deg]">
            ★ Official registrations, team entries & guidelines are hosted on Unstop
          </span>
        </div>
      </StudentHead>

      <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
        {/* Notice Card: All registrations are hosted on Unstop */}
        <div className="relative rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-5 sm:p-6 shadow-[3px_4px_0px_rgba(30,26,23,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-11 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] shrink-0 mt-0.5">
              <Globe className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-grotesk text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-[#EF4B35] text-white border border-[#1E1A17]">
                  Unstop Official Hub
                </span>
                <span className="font-script text-sm font-bold text-[#1E1A17]/80">
                  External Portal
                </span>
              </div>
              <h2 className="font-grotesk text-lg sm:text-xl font-black text-[#1E1A17] mt-1">
                Registrations are handled exclusively on Unstop
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-[#1E1A17]/80 max-w-2xl">
                All Crescendo fest competitions, hackathons, and esports registrations take place directly on Unstop. Click any flyer below to open the registration page in a new tab.
              </p>
            </div>
          </div>

          <a
            href="https://unstop.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer shrink-0 inline-flex items-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-white px-4 py-2.5 font-grotesk text-xs font-bold text-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] hover:bg-[#F4EFE3] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            My Unstop Dashboard <ExternalLink className="size-3.5" />
          </a>
        </div>

        {/* Error notification banner if API failed */}
        {eventsError && (
          <div className="p-4 rounded-xl border-[1.5px] border-[#EF4B35] bg-[#FDE9E6] text-[#1E1A17] flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-[#EF4B35] shrink-0" />
              <div>
                <p className="font-grotesk text-sm font-bold text-[#EF4B35]">
                  Could not refresh live campus notices
                </p>
                <p className="text-xs font-semibold text-[#1E1A17]/80">
                  Showing available notices. You can retry refreshing anytime.
                </p>
              </div>
            </div>
            <button
              onClick={() => mutateEvents()}
              className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E1A17] bg-white text-xs font-bold hover:bg-[#F4EFE3] transition-colors"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Search & Category Filter Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <span className="font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/70 shrink-0 mr-1">
              Filter:
            </span>
            {CATEGORY_CHIPS.map((chip) => {
              const active = activeCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveCategory(chip.id)}
                  className={cn(
                    "cursor-pointer shrink-0 rounded-lg border-[1.5px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider font-grotesk transition-all duration-150 active:scale-95 shadow-sm",
                    active
                      ? "border-[#1E1A17] bg-[#EF4B35] text-white shadow-[2px_2px_0px_#1E1A17]"
                      : "border-[#1E1A17]/35 bg-white text-[#1E1A17] hover:border-[#1E1A17] hover:bg-[#F4EFE3]"
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1E1A17]/60" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices..."
              className="w-full rounded-lg border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] py-2 pl-9 pr-3 text-xs font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E1A17]"
            />
          </div>
        </div>

        {/* MAIN BOARD SECTION: CAMPUS EVENTS TO REGISTER ON UNSTOP */}
        <BoardSection
          title="Campus Events & Notices"
          sub="Explore events and register directly on Unstop"
          annotation="Click any flyer to open Unstop →"
        >
          {/* Active Notice Count */}
          <div className="mb-6 flex items-center justify-between border-b border-[#1E1A17]/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-grotesk text-xs uppercase tracking-widest font-extrabold text-[#1E1A17]/80">
                Active Notices:
              </span>
              <span className="font-grotesk text-xs font-black bg-[#EF4B35] text-white px-2 py-0.5 rounded border border-[#1E1A17]">
                {visibleCount} Face Up
              </span>
            </div>

            <span className="font-script text-sm text-[#1E1A17]/75 hidden sm:inline rotate-[-1deg]">
              Opens in a new tab with official Unstop registration 📌
            </span>
          </div>

          {loadingEvents ? (
            <div className="py-12 text-center text-sm font-semibold text-[#1E1A17]/70">
              Loading notices from the board...
            </div>
          ) : visibleCount === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#1E1A17]/30 rounded-xl bg-[#F4EFE3]/50 my-2">
              <p className="font-grotesk text-2xl font-black text-[#1E1A17]">
                Nothing pinned yet. Take a break! ☕
              </p>
              <p className="font-script text-lg text-[#EF4B35] mt-1">
                No events match this filter. Try selecting another category!
              </p>
              <div className="mt-4">
                <PrimaryButton
                  size="sm"
                  variant="mustard"
                  onClick={() => {
                    setActiveCategory("all");
                    setSearch("");
                  }}
                >
                  Show All Events
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pt-2 pb-6">
              {displayEvents.map((flyer, idx) => (
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
          )}

          <div className="mt-6 pt-4 border-t border-[#1E1A17]/15 flex items-center justify-between">
            <span className="font-grotesk text-xs font-bold text-[#1E1A17]/70">
              Want to see department filters & full notice board?
            </span>
            <PrimaryButton href="/events" size="sm" variant="cream">
              Open Full Noticeboard
            </PrimaryButton>
          </div>
        </BoardSection>
      </div>
    </>
  );
}
