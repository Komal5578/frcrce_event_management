"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Clock,
  HelpCircle,
  MapPinOff,
  Compass,
  AlertCircle,
  Building,
} from "lucide-react";
import { Tape } from "@/components/board/Tape";
import type { MatchedEvent } from "@/lib/venue-matcher";
import { cn } from "@/lib/cn";

export interface UnannouncedEventsDrawerProps {
  unannouncedEvents: MatchedEvent[];
  notInFloorGuideEvents: MatchedEvent[];
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "tba" | "not_in_guide";
}

export function UnannouncedEventsDrawer({
  unannouncedEvents,
  notInFloorGuideEvents,
  isOpen,
  onClose,
  defaultTab = "tba",
}: UnannouncedEventsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"tba" | "not_in_guide">(defaultTab);
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen && (!prevIsOpen || defaultTab !== prevDefaultTab)) {
    setPrevIsOpen(isOpen);
    setPrevDefaultTab(defaultTab);
    setActiveTab(defaultTab);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  const currentList =
    activeTab === "tba" ? unannouncedEvents : notInFloorGuideEvents;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Campus event locations"
        aria-modal="true"
        className={cn(
          "fixed z-50 inset-y-0 right-0 w-full sm:w-[500px] bg-[#F4EFE3] border-l-2 border-[#1E1A17]",
          "p-6 shadow-[-8px_0px_30px_rgba(30,26,23,0.25)] flex flex-col justify-between overflow-y-auto"
        )}
      >
        <Tape position="top" />

        <div className="pt-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-lg bg-[#F2B93B] border border-[#1E1A17] text-[#1E1A17]">
                {activeTab === "tba" ? (
                  <MapPinOff className="size-5" />
                ) : (
                  <Compass className="size-5" />
                )}
              </div>
              <div>
                <h2 className="font-grotesk text-xl font-black text-[#1E1A17]">
                  Unmapped & Guide Locations
                </h2>
                <p className="text-xs font-semibold text-[#1E1A17]/75">
                  All Crescendo 2026 events accounted for
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="size-8 grid place-items-center rounded-lg border border-[#1E1A17] bg-[#D9CBB3] text-[#1E1A17] hover:bg-[#EF4B35] hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#D9CBB3] border border-[#1E1A17] mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("tba")}
              className={cn(
                "py-1.5 px-2 rounded-lg font-grotesk text-xs font-black transition-all flex items-center justify-center gap-1.5",
                activeTab === "tba"
                  ? "bg-[#1E1A17] text-[#F4EFE3] shadow-sm"
                  : "text-[#1E1A17] hover:bg-white/50"
              )}
            >
              <span>Room TBA</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  activeTab === "tba"
                    ? "bg-[#EF4B35] text-white"
                    : "bg-[#1E1A17]/20 text-[#1E1A17]"
                )}
              >
                {unannouncedEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("not_in_guide")}
              className={cn(
                "py-1.5 px-2 rounded-lg font-grotesk text-xs font-black transition-all flex items-center justify-center gap-1.5",
                activeTab === "not_in_guide"
                  ? "bg-[#1E1A17] text-[#F4EFE3] shadow-sm"
                  : "text-[#1E1A17] hover:bg-white/50"
              )}
            >
              <span>Not in Floor Guide</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  activeTab === "not_in_guide"
                    ? "bg-[#EF4B35] text-white"
                    : "bg-[#1E1A17]/20 text-[#1E1A17]"
                )}
              >
                {notInFloorGuideEvents.length}
              </span>
            </button>
          </div>

          {/* Informational Guidance Alert */}
          {activeTab === "tba" ? (
            <div className="mb-4 p-3 rounded-xl border border-[#1E1A17] bg-[#D9CBB3]/40 text-xs font-medium text-[#1E1A17] flex items-start gap-2">
              <HelpCircle className="size-4 shrink-0 text-[#EF4B35] mt-0.5" />
              <span>
                These events are officially confirmed for Crescendo 2026, but the specific classroom or lab allocation is pending. Check the <strong>Ground Floor Help Desk</strong> on event morning for live room announcements.
              </span>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-xl border border-[#1E1A17] bg-[#F7EDD9] text-xs font-medium text-[#1E1A17] flex items-start gap-2">
              <Building className="size-4 shrink-0 text-[#1E1A17] mt-0.5" />
              <span>
                These venues (Auditorium, Seminar Halls A/B, Open Air Theatre, Sports Ground, Main Gate, Lab 3) are located in adjoining campus wings outside the reported 10-level main building. Ask at the <strong>Ground Floor Entrance</strong> for directions.
              </span>
            </div>
          )}

          {/* Event Cards */}
          <div className="space-y-3">
            {currentList.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-3.5 shadow-[2px_2px_0px_#1E1A17]"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-grotesk text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#1E1A17]/10 text-[#1E1A17]">
                    {ev.department}
                  </span>
                  <span
                    className={cn(
                      "font-grotesk text-[10px] font-bold px-2 py-0.5 rounded border",
                      activeTab === "tba"
                        ? "text-[#EF4B35] bg-[#FDE9E6] border-[#EF4B35]/30"
                        : "text-[#1E1A17] bg-[#D9CBB3] border-[#1E1A17]/30"
                    )}
                  >
                    {activeTab === "tba" ? "Room TBA" : ev.venueName}
                  </span>
                </div>

                <h3 className="font-grotesk text-base font-black text-[#1E1A17] leading-tight mb-2">
                  {ev.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#1E1A17]/75 mb-3 border-t border-[#1E1A17]/15 pt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-[#1E1A17]/60" />
                    <span>
                      {ev.day}
                      {ev.startsAt
                        ? ` · ${new Date(ev.startsAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : ""}
                    </span>
                  </div>

                  {ev.venueLocation && ev.venueLocation !== "Fr. CRCE Campus" && (
                    <div className="text-[11px] text-[#1E1A17]/60">
                      📍 {ev.venueLocation}
                    </div>
                  )}
                </div>

                {ev.registrationUrl ? (
                  <a
                    href={ev.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] text-white font-grotesk text-xs font-black shadow-[1.5px_1.5px_0px_#1E1A17] hover:bg-[#d43d28] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    <span>Register on Unstop</span>
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <div className="text-center py-1 font-grotesk text-xs font-bold text-[#1E1A17]/60 bg-[#D9CBB3]/30 rounded">
                    Details on festival noticeboard
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1E1A17]/20 text-center text-xs text-[#1E1A17]/60">
          FrCRCE Events Noticeboard · Crescendo 2026
        </div>
      </div>
    </>
  );
}
