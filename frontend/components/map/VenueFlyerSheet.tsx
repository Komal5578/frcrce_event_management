"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  Users,
  ExternalLink,
  Navigation,
  AlertTriangle,
  Share2,
  Check,
  Building,
} from "lucide-react";
import { Tape } from "@/components/board/Tape";
import type { CampusFloor, FloorEntity } from "@/lib/campus-map-data";
import type { MatchedEvent } from "@/lib/venue-matcher";
import { useMe } from "@/lib/session";
import { findCouncilForDepartment } from "@/lib/demo/councils";
import { cn } from "@/lib/cn";

export interface VenueFlyerSheetProps {
  entity: FloorEntity | null;
  floor: CampusFloor;
  events: MatchedEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export function VenueFlyerSheet({
  entity,
  floor,
  events,
  isOpen,
  onClose,
}: VenueFlyerSheetProps) {
  const { me } = useMe();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!entity || !isOpen) return null;

  const handleCopyLink = (eventId?: string) => {
    const url = eventId
      ? `${window.location.origin}/map?event=${encodeURIComponent(eventId)}`
      : `${window.location.origin}/map?floor=${encodeURIComponent(floor.id)}&entity=${encodeURIComponent(entity.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(eventId ?? "entity");
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const hasUnverifiedHint = events.some((e) =>
    e.matchReason?.toLowerCase().includes("unverified")
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden transition-opacity"
      />

      {/* FLYER CARD: Side panel on desktop, Bottom sheet on mobile */}
      <div
        role="dialog"
        aria-label={`${entity.name} details`}
        aria-modal="true"
        className={cn(
          "fixed z-50 transition-all duration-300 ease-out",
          // Mobile: bottom sheet
          "bottom-0 inset-x-0 max-h-[85vh] rounded-t-3xl border-t-2 border-x-2 border-[#1E1A17] bg-[#F4EFE3] p-5 shadow-[0_-8px_30px_rgba(30,26,23,0.25)] overflow-y-auto",
          // Desktop: side panel
          "lg:bottom-auto lg:top-20 lg:right-6 lg:w-[420px] lg:max-h-[calc(100vh-6rem)] lg:rounded-2xl lg:border-[1.5px] lg:shadow-[6px_8px_0px_#1E1A17]"
        )}
      >
        {/* Masking tape on top */}
        <Tape position="top" />

        {/* Header with Close Button */}
        <div className="flex items-start justify-between gap-3 pt-2 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="font-grotesk text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-[#1E1A17] text-[#F4EFE3]">
                {floor.label}
              </span>
              <span
                className={cn(
                  "font-grotesk text-xs font-bold px-2 py-0.5 rounded border",
                  entity.status === "reported"
                    ? "bg-[#B5DDD4] text-[#1E1A17] border-[#1E1A17]/30"
                    : "bg-[#F2B93B] text-[#1E1A17] border-[#1E1A17]/40"
                )}
              >
                {entity.status === "reported" ? "Reported Layout" : "To Confirm"}
              </span>
              {entity.countLabel && (
                <span className="font-grotesk text-xs font-semibold px-2 py-0.5 rounded bg-[#D9CBB3] text-[#1E1A17]/80">
                  {entity.countLabel}
                </span>
              )}
            </div>

            <h2 className="font-grotesk text-xl sm:text-2xl font-black text-[#1E1A17] tracking-[-0.01em] leading-tight">
              {entity.name}
            </h2>
            {entity.description && (
              <p className="text-xs text-[#1E1A17]/75 font-semibold mt-1">
                {entity.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close venue details"
            className="size-8 shrink-0 grid place-items-center rounded-lg border border-[#1E1A17] bg-[#D9CBB3] text-[#1E1A17] hover:bg-[#EF4B35] hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* FACT-STRICT WRITTEN DIRECTIONS BOX (No invented turns) */}
        <div className="mb-4 rounded-xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3]/50 p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 font-grotesk text-xs font-black uppercase text-[#1E1A17]">
              <Navigation className="size-3.5 text-[#EF4B35]" />
              <span>Written Directions (Stated Facts Only)</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyLink()}
              title="Copy link to this zone"
              className="text-xs font-bold text-[#1E1A17]/70 hover:text-[#1E1A17] flex items-center gap-1"
            >
              {copiedId === "entity" ? (
                <>
                  <Check className="size-3 text-green-700" />
                  <span className="text-green-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-xs font-medium text-[#1E1A17]">
            <div className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-[#1E1A17]/20">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#1E1A17] text-[#F4EFE3] text-[9px] font-black mt-0.5">
                1
              </span>
              <div>
                <strong className="block text-[11px] font-bold text-[#EF4B35] uppercase font-grotesk">
                  Reaching the {floor.label}
                </strong>
                <span className="leading-snug">{floor.howToReach}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-[#1E1A17]/20">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#1E1A17] text-[#F4EFE3] text-[9px] font-black mt-0.5">
                2
              </span>
              <div>
                <strong className="block text-[11px] font-bold text-[#EF4B35] uppercase font-grotesk">
                  Location on Floor
                </strong>
                <span className="leading-snug">{entity.directions}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#1E1A17]/60 font-semibold italic">
            * Directions are built solely from student-reported facts. No unverified corridor turns or distances are invented.
          </div>
        </div>

        {/* Room number matching hint banner if applicable */}
        {hasUnverifiedHint && (
          <div className="mb-4 rounded-xl border border-[#F2B93B] bg-[#FFF9E6] p-2.5 text-xs text-[#8A5300] flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 text-[#C05621] mt-0.5" />
            <div>
              <span className="font-bold">Unverified Room Number Hint:</span> This event was matched using the room numbering pattern (e.g. 6xx on 6th Floor, 8xx on 8th Floor). Exact room position in the lane is to confirm.
            </div>
          </div>
        )}

        {/* Events Scheduled in this Zone */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-grotesk text-sm font-black uppercase text-[#1E1A17]">
              Scheduled Events ({events.length})
            </h3>
            {events.length > 0 && (
              <span className="text-[11px] font-bold text-[#EF4B35]">
                {events.filter((e) => e.timeWindow === "now").length > 0
                  ? "🔴 Live Event in progress"
                  : "Upcoming"}
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1E1A17]/30 bg-[#D9CBB3]/30 p-4 text-center">
              <Building className="size-6 text-[#1E1A17]/40 mx-auto mb-1.5" />
              <p className="font-grotesk text-xs font-bold text-[#1E1A17]/80">
                No events currently scheduled here
              </p>
              <p className="text-[11px] text-[#1E1A17]/60 mt-1">
                This zone is available for campus circulation and facilities. Tap other blocks to see event locations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const councilMatch = findCouncilForDepartment(ev.department);
                const showHeadDetails = Boolean(me && councilMatch?.head);

                return (
                <div
                  key={ev.id}
                  className="rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-3.5 shadow-[2px_2px_0px_#1E1A17]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-grotesk text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#1E1A17] text-[#F4EFE3]">
                        {councilMatch ? councilMatch.name : ev.department}
                      </span>
                      {showHeadDetails && councilMatch && (
                        <span className="font-grotesk text-[10px] font-bold text-[#1E1A17]/80 flex items-center gap-1">
                          <span>Head: {councilMatch.head.name}</span>
                          {!councilMatch.head.verified && (
                            <span className="px-1 py-0.2 rounded bg-[#EF4B35] text-[9px] font-black uppercase text-white border border-[#1E1A17] shadow-[1px_1px_0px_#1E1A17]" title="Demo fictitious name">
                              DEMO
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {ev.timeWindow === "now" && (
                      <span className="font-grotesk text-[10px] font-black uppercase text-white bg-[#EF4B35] px-2 py-0.5 rounded animate-pulse">
                        Live Now
                      </span>
                    )}
                  </div>

                  <h4 className="font-grotesk text-base font-black text-[#1E1A17] leading-snug mb-1">
                    {ev.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#1E1A17]/75 mb-3 border-t border-[#1E1A17]/10 pt-2">
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

                    <div className="flex items-center gap-1">
                      <Users className="size-3 text-[#1E1A17]/60" />
                      <span>
                        {ev.seatsLeft !== null
                          ? `${ev.seatsLeft} seats left`
                          : "Registration Open"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.registrationUrl ? (
                      <a
                        href={ev.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] text-white font-grotesk text-xs font-black shadow-[1.5px_1.5px_0px_#1E1A17] hover:bg-[#d43d28] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                      >
                        <span>Register on Unstop</span>
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <div className="flex-1 text-center py-1 font-grotesk text-xs font-bold text-[#1E1A17]/60 bg-[#D9CBB3]/30 rounded">
                        On-Spot / Noticeboard
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyLink(ev.id)}
                      title="Copy link to this event flyer on map"
                      className="size-8 grid place-items-center rounded-lg border border-[#1E1A17] bg-[#F4EFE3] hover:bg-white text-[#1E1A17] transition-colors"
                    >
                      {copiedId === ev.id ? (
                        <Check className="size-3.5 text-green-700" />
                      ) : (
                        <Share2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
