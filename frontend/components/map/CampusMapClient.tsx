"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  Compass,
  HelpCircle,
  Navigation,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Layers,
  Check,
  Building,
} from "lucide-react";
import {
  campusFloors,
  floorEntities,
  type CampusFloor,
  type FloorEntity,
} from "@/lib/campus-map-data";
import {
  matchEventsToVenues,
  normalizeVenueText,
  type MatchedEvent,
  type VenueMatchResult,
} from "@/lib/venue-matcher";
import { FloorSchematic } from "./FloorSchematic";
import { VenueFlyerSheet } from "./VenueFlyerSheet";
import { UnannouncedEventsDrawer } from "./UnannouncedEventsDrawer";
import { useMe } from "@/lib/session";
import { api } from "@/lib/api";
import type { Me, Role, EventItem } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface CampusMapClientProps {
  initialEvents: EventItem[];
  userRole?: string;
  initialEventId?: string;
  initialFloorId?: string;
}

export function CampusMapClient({
  initialEvents,
  userRole,
  initialEventId,
  initialFloorId,
}: CampusMapClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Session heartbeat: if session expires while map is open, prompt sign-in
  const { me, signedOut, mutate } = useMe();
  const [reloggingIn, setReloggingIn] = useState<Role | null>(null);

  // Toast notification for copy/feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Parse Query Parameters
  const paramEvent = searchParams.get("event") ?? initialEventId ?? null;
  const paramFloor = searchParams.get("floor") ?? initialFloorId ?? null;
  const paramEntity = searchParams.get("entity") ?? null;

  // Match events to campus venues
  const matchResult: VenueMatchResult = useMemo(() => {
    return matchEventsToVenues(initialEvents);
  }, [initialEvents]);

  // Active filters and state
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    paramFloor ?? "ground"
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    paramEntity ?? null
  );
  const [dayFilter, setDayFilter] = useState<"all" | "29 Oct" | "30 Oct">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "now" | "next_hour" | "later">("all");
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [flyerSheetOpen, setFlyerSheetOpen] = useState(false);
  const [unannouncedDrawerOpen, setUnannouncedDrawerOpen] = useState(false);
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<"tba" | "not_in_guide">("tba");

  // Handle ?event=<id> auto-focus
  useEffect(() => {
    if (!paramEvent) return;

    // 1. Check matched entities
    for (const [entityId, evList] of Object.entries(matchResult.matchedEntityMap)) {
      const found = evList.find(
        (e) => e.id === paramEvent || e.rawEvent.id === paramEvent
      );
      if (found) {
        const entity = floorEntities.find((e) => e.id === entityId);
        if (entity) {
          setSelectedFloorId(entity.floorId);
          setSelectedEntityId(entity.id);
          setFlyerSheetOpen(true);
          return;
        }
      }
    }

    // 2. Check TBA events
    const inTba = matchResult.unannouncedEvents.find(
      (e) => e.id === paramEvent || e.rawEvent.id === paramEvent
    );
    if (inTba) {
      setDrawerDefaultTab("tba");
      setUnannouncedDrawerOpen(true);
      return;
    }

    // 3. Check Not in Floor Guide events
    const inNotInGuide = matchResult.notInFloorGuideEvents.find(
      (e) => e.id === paramEvent || e.rawEvent.id === paramEvent
    );
    if (inNotInGuide) {
      setDrawerDefaultTab("not_in_guide");
      setUnannouncedDrawerOpen(true);
      return;
    }
  }, [paramEvent, matchResult]);

  // Filter events according to day, time, and search
  const filteredEntityMap = useMemo(() => {
    const result: Record<string, MatchedEvent[]> = {};
    const q = normalizeVenueText(searchQuery);

    for (const [entityId, evList] of Object.entries(matchResult.matchedEntityMap)) {
      result[entityId] = evList.filter((ev) => {
        // Day filter
        if (dayFilter !== "all" && ev.day !== dayFilter) return false;
        // Time filter
        if (timeFilter !== "all" && ev.timeWindow !== timeFilter) return false;
        // Search filter
        if (q) {
          const matchTitle = normalizeVenueText(ev.title).includes(q);
          const matchDept = normalizeVenueText(ev.department).includes(q);
          const matchVenue = normalizeVenueText(ev.venueName).includes(q);
          if (!matchTitle && !matchDept && !matchVenue) return false;
        }
        return true;
      });
    }
    return result;
  }, [matchResult, dayFilter, timeFilter, searchQuery]);

  const currentFloor =
    campusFloors.find((f) => f.id === selectedFloorId) ?? campusFloors[0];

  const selectedEntity =
    floorEntities.find((e) => e.id === selectedEntityId) ?? null;

  const selectedEntityEvents = selectedEntityId
    ? filteredEntityMap[selectedEntityId] ?? []
    : [];

  // Report issue handler (Item 7: opens mailto or copies feedback message)
  const handleReportIssue = (floorLabel: string) => {
    const subject = `FrCRCE Campus Map Feedback - ${floorLabel}`;
    const body = `Hi Crescendo Map Team,\n\nI have a correction for ${floorLabel}:\n[Please describe the room or floor detail to update here]\n\nThank you!`;

    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(`${subject}\n\n${body}`)
        .then(() => {
          showToast(`Feedback template copied for ${floorLabel}! Opening mail client...`);
        })
        .catch(() => {
          showToast(`Send feedback for ${floorLabel} to crescendo-map@frcrce.ac.in`);
        });
    } else {
      showToast(`Send feedback for ${floorLabel} to crescendo-map@frcrce.ac.in`);
    }
  };

  // Quick 1-click re-login if session expired while on map
  const handleQuickRelogin = async (role: Role) => {
    setReloggingIn(role);
    try {
      const actor = await api<Me>("/api/auth/demo-login", {
        method: "POST",
        json: { role },
      });
      await mutate(actor, { revalidate: true });
    } catch {
      router.replace(
        `/login?next=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}&reason=map`
      );
    } finally {
      setReloggingIn(null);
    }
  };

  // If session expired while on page, show noticeboard session expired overlay
  if (signedOut) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-6 sm:p-8 shadow-[4px_6px_0px_#1E1A17] text-center">
          <div className="mx-auto size-12 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] mb-3">
            <ShieldAlert className="size-6" />
          </div>
          <span className="font-script text-base font-bold text-[#EF4B35] block rotate-[-2deg]">
            ★ Session Expired
          </span>
          <h2 className="font-grotesk text-2xl font-black text-[#1E1A17] mt-1">
            Sign In to Continue
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-semibold text-[#1E1A17]/80">
            Sign-in is required to view the Crescendo Campus Map. Select any role below for 1-click access.
          </p>

          <div className="space-y-2 mt-5">
            {(["student", "coordinator", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleQuickRelogin(r)}
                disabled={reloggingIn !== null}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#1E1A17] bg-white font-grotesk text-xs uppercase font-extrabold text-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] hover:bg-[#F4EFE3] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
              >
                <span>Continue as {r}</span>
                <ArrowRight className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-6 py-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1E1A17] text-[#F4EFE3] px-4 py-2.5 rounded-xl border border-white/20 shadow-lg text-xs font-bold animate-in fade-in duration-200">
          <Check className="size-4 text-[#B5DDD4]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* NOTICEBOARD HEADER & FILTER CONTROLS                     */}
      {/* ======================================================== */}
      <div className="mb-4 space-y-3">
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1E1A17]/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-script text-base font-bold text-[#EF4B35] rotate-[-2deg]">
                ★ Crescendo 2026
              </span>
              <span className="text-xs font-grotesk font-extrabold uppercase px-2 py-0.5 rounded bg-[#1E1A17] text-[#F4EFE3]">
                Fr. CRCE Main Building (10 Levels)
              </span>
            </div>
            <h1 className="font-grotesk text-2xl sm:text-3xl font-black tracking-[-0.01em] text-[#1E1A17]">
              Campus Floor Map & Schematics
            </h1>
          </div>

          {/* Quick Drawer Triggers for Unmapped & TBA Events */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDrawerDefaultTab("tba");
                setUnannouncedDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E1A17] bg-[#F2B93B] text-[#1E1A17] font-grotesk text-xs font-black shadow-[1.5px_1.5px_0px_#1E1A17] hover:bg-[#e0ab34] transition-all"
            >
              <HelpCircle className="size-3.5" />
              <span>Room TBA ({matchResult.unannouncedEvents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerDefaultTab("not_in_guide");
                setUnannouncedDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E1A17] bg-[#D9CBB3] text-[#1E1A17] font-grotesk text-xs font-black shadow-[1.5px_1.5px_0px_#1E1A17] hover:bg-[#c9baa0] transition-all"
            >
              <Building className="size-3.5" />
              <span>Not in Floor Guide ({matchResult.notInFloorGuideEvents.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Pills Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#1E1A17]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, club or zone (e.g. Techनीक, Escape Room, Samvaad, 108)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border-[1.5px] border-[#1E1A17] bg-white text-xs sm:text-sm font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1E1A17]"
            />
          </div>

          {/* Day Toggle & Time Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Day Toggle */}
            <div className="flex items-center rounded-xl border border-[#1E1A17] bg-[#D9CBB3] p-0.5 shadow-sm">
              {(["all", "29 Oct", "30 Oct"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDayFilter(d)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-grotesk text-xs font-black transition-all",
                    dayFilter === d
                      ? "bg-[#1E1A17] text-[#F4EFE3] shadow-sm"
                      : "text-[#1E1A17]/80 hover:text-[#1E1A17]"
                  )}
                >
                  {d === "all" ? "All Days" : d}
                </button>
              ))}
            </div>

            {/* Time Chips */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {[
                { id: "all", label: "All Times" },
                { id: "now", label: "Live Now 🔴" },
                { id: "next_hour", label: "Next Hour" },
                { id: "later", label: "Later" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeFilter(t.id as typeof timeFilter)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border font-grotesk text-xs font-bold transition-all whitespace-nowrap",
                    timeFilter === t.id
                      ? "border-[#1E1A17] bg-[#EF4B35] text-white shadow-[1px_1px_0px_#1E1A17]"
                      : "border-[#1E1A17]/30 bg-white text-[#1E1A17] hover:bg-[#D9CBB3]/40"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Facilities Filter Chips Bar (Item 8: lifts, washrooms, water purifier, canteen, library) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <span className="font-grotesk font-black text-[#1E1A17] uppercase tracking-wider text-[11px] shrink-0 mr-1">
            Facilities:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "lifts", label: "🛗 Lifts & Lobby" },
            { id: "washrooms", label: "🚻 Washrooms" },
            { id: "purifier", label: "💧 Water Purifier" },
            { id: "canteen", label: "☕ Canteen / Cafeteria" },
            { id: "library", label: "📚 Library" },
          ].map((fac) => (
            <button
              key={fac.id}
              type="button"
              onClick={() => setFacilityFilter(fac.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg border font-grotesk text-xs font-bold transition-all whitespace-nowrap shrink-0",
                facilityFilter === fac.id
                  ? "border-[#1E1A17] bg-[#1E1A17] text-[#F4EFE3] shadow-sm"
                  : "border-[#1E1A17]/30 bg-[#F4EFE3] text-[#1E1A17] hover:bg-white"
              )}
            >
              {fac.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN INTERACTIVE AREA: VERTICAL TABS + SCHEMATIC        */}
      {/* ======================================================== */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] gap-4 items-start">
        {/* VERTICAL FLOOR SELECTOR (Tab-shaped buttons with slide feel: 9th down to Ground) */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-y-visible gap-1.5 p-1.5 bg-[#D9CBB3] rounded-2xl border-[1.5px] border-[#1E1A17] shadow-[2px_3px_0px_#1E1A17]">
          {[...campusFloors].reverse().map((fl) => {
            const isSelected = fl.id === selectedFloorId;
            const floorEventsCount = floorEntities
              .filter((e) => e.floorId === fl.id)
              .reduce(
                (sum, e) => sum + (filteredEntityMap[e.id]?.length ?? 0),
                0
              );

            return (
              <button
                key={fl.id}
                type="button"
                onClick={() => {
                  setSelectedFloorId(fl.id);
                  setSelectedEntityId(null);
                }}
                className={cn(
                  "relative flex-1 md:flex-none flex flex-col items-start justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer min-w-[130px] md:min-w-0",
                  "focus-visible:outline-2 focus-visible:outline-[#1E1A17]",
                  isSelected
                    ? "bg-[#1E1A17] text-[#F4EFE3] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] md:translate-x-1"
                    : "bg-[#F4EFE3] text-[#1E1A17] border border-[#1E1A17]/30 hover:bg-white"
                )}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "font-grotesk text-xs font-black px-1.5 py-0.5 rounded shrink-0",
                          isSelected
                            ? "bg-white/20 text-[#F4EFE3]"
                            : "bg-[#1E1A17]/10 text-[#1E1A17]"
                        )}
                      >
                        {fl.shortLabel}
                      </span>
                      <span className="font-grotesk text-xs sm:text-sm font-black truncate">
                        {fl.label}
                      </span>
                    </div>

                    {floorEventsCount > 0 && (
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0",
                          isSelected
                            ? "bg-[#EF4B35] text-white"
                            : "bg-[#EF4B35]/20 text-[#EF4B35]"
                        )}
                      >
                        {floorEventsCount} ev
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "text-[11px] font-semibold truncate mt-1 leading-tight",
                      isSelected ? "text-[#F2B93B]" : "text-[#1E1A17]/75"
                    )}
                  >
                    {fl.department}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* SCHEMATIC CANVAS */}
        <div className="flex-1 w-full min-w-0">
          <FloorSchematic
            floor={currentFloor}
            matchedEntityMap={filteredEntityMap}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(eId) => {
              setSelectedEntityId(eId);
              setFlyerSheetOpen(true);
            }}
            facilityFilter={facilityFilter}
            onReportIssue={handleReportIssue}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* VENUE FLYER SHEET / SIDE PANEL                           */}
      {/* ======================================================== */}
      <VenueFlyerSheet
        entity={selectedEntity}
        floor={currentFloor}
        events={selectedEntityEvents}
        isOpen={flyerSheetOpen && selectedEntity !== null}
        onClose={() => setFlyerSheetOpen(false)}
      />

      {/* ======================================================== */}
      {/* UNANNOUNCED EVENTS (TBA & OUTSIDE GUIDE) DRAWER          */}
      {/* ======================================================== */}
      <UnannouncedEventsDrawer
        unannouncedEvents={matchResult.unannouncedEvents}
        notInFloorGuideEvents={matchResult.notInFloorGuideEvents}
        isOpen={unannouncedDrawerOpen}
        onClose={() => setUnannouncedDrawerOpen(false)}
        defaultTab={drawerDefaultTab}
      />
    </div>
  );
}
