"use client";

import React, { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, AlertCircle, Droplets, Info } from "lucide-react";
import {
  campusFloors,
  floorEntities,
  type CampusFloor,
  type FloorEntity,
} from "@/lib/campus-map-data";
import type { MatchedEvent } from "@/lib/venue-matcher";
import { cn } from "@/lib/cn";

export interface FloorSchematicProps {
  floor: CampusFloor;
  matchedEntityMap: Record<string, MatchedEvent[]>;
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  facilityFilter?: string; // "all" | "lifts" | "washrooms" | "purifier" | "canteen" | "library"
  onReportIssue: (floorName: string) => void;
}

function getBlockLabelLines(name: string, bw: number): string[] {
  // If block width is small and name has spaces, split into 2 lines for clean readability
  const maxSingleLineChars = bw > 250 ? 30 : bw > 180 ? 22 : 16;
  if (name.length <= maxSingleLineChars) return [name];

  const words = name.split(" ");
  if (words.length <= 1) return [name];

  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export function FloorSchematic({
  floor,
  matchedEntityMap,
  selectedEntityId,
  onSelectEntity,
  facilityFilter = "all",
  onReportIssue,
}: FloorSchematicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentEntities = floorEntities.filter((e) => e.floorId === floor.id);

  // Reset zoom & pan when floor changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [floor.id]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[640px] bg-[#EBE2D0] rounded-2xl border-[1.5px] border-[#1E1A17] shadow-[4px_6px_0px_rgba(30,26,23,0.18)] overflow-hidden select-none flex flex-col justify-between">
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1E1A17 1px, transparent 1px), linear-gradient(to bottom, #1E1A17 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Floating Header Banner */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 max-w-[85%] pointer-events-none">
        <div className="bg-[#1E1A17] text-[#F4EFE3] px-3.5 py-1.5 rounded-lg border border-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] flex items-center gap-2">
          <span className="font-grotesk text-sm sm:text-base font-black">
            {floor.label}
          </span>
          <span className="text-xs text-[#F2B93B] font-semibold border-l border-white/20 pl-2 truncate">
            {floor.department}
          </span>
        </div>

        {/* Fact-strict How to reach badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#F4EFE3]/95 text-[#1E1A17] px-3 py-1 rounded-lg border border-[#1E1A17]/30 text-xs font-semibold shadow-sm">
          <span className="font-bold text-[#EF4B35]">Reach:</span>
          <span>{floor.howToReach}</span>
        </div>
      </div>

      {/* Map Controls (Zoom / Pan / Reset) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#F4EFE3]/95 backdrop-blur-sm p-1 rounded-xl border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17]">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="size-8 grid place-items-center rounded-lg hover:bg-[#D9CBB3] text-[#1E1A17] transition-colors"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="size-8 grid place-items-center rounded-lg hover:bg-[#D9CBB3] text-[#1E1A17] transition-colors"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          aria-label="Reset view"
          className="size-8 grid place-items-center rounded-lg hover:bg-[#D9CBB3] text-[#1E1A17] transition-colors"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* SVG Canvas Area (Takes full flex-1 height above footer) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex-1 w-full min-h-0 cursor-grab active:cursor-grabbing flex items-center justify-center p-3 pt-12 sm:pt-14",
          isDragging && "cursor-grabbing"
        )}
      >
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full max-h-[560px] transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <defs>
            {/* Pattern for Staircases / Hatched areas */}
            <pattern
              id="stairs-hatch"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#1E1A17" strokeWidth="1.5" />
            </pattern>

            {/* Pattern for Lane / Circulation */}
            <pattern
              id="lane-dots"
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="6" cy="6" r="1.2" fill="#1E1A17" opacity="0.3" />
            </pattern>
          </defs>

          {/* ======================================================== */}
          {/* FLOOR SLAB BASE BOUNDARY                                 */}
          {/* ======================================================== */}
          <rect
            x="35"
            y="35"
            width="930"
            height="530"
            rx="18"
            fill="#DDD0BD"
            stroke="#1E1A17"
            strokeWidth="3.5"
          />

          {/* ======================================================== */}
          {/* RENDER REPORTED ENTITY BLOCKS                            */}
          {/* ======================================================== */}
          {currentEntities.map((ent) => {
            const isSelected = ent.id === selectedEntityId;
            const events = matchedEntityMap[ent.id] ?? [];
            const hasLiveNow = events.some((e) => e.timeWindow === "now");
            const hasLater = events.length > 0 && !hasLiveNow;

            // Coordinates on 1000x600 viewport
            const bx = (ent.x / 100) * 1000;
            const by = (ent.y / 100) * 600;
            const bw = (ent.width / 100) * 1000;
            const bh = (ent.height / 100) * 600;

            // Thematic coloring based on reported room type
            let fillBg = "#F4EFE3"; // default cream
            let strokeColor = "#1E1A17";

            if (ent.type === "lift-lobby") {
              fillBg = "#E5D7C0";
            } else if (ent.type === "lane") {
              fillBg = "url(#lane-dots)";
            } else if (ent.type === "lab") {
              fillBg = "#E9F3ED"; // soft lab green/cream
            } else if (ent.type === "classroom") {
              fillBg = "#FFFBF2"; // classroom cream
            } else if (ent.type === "staffroom") {
              fillBg = "#F4E8D4"; // staffroom tan
            } else if (ent.type === "purifier") {
              fillBg = "#D8EDF2"; // cool aqua
            } else if (ent.type === "washroom-student" || ent.type === "washroom-staff") {
              fillBg = "#DCF0EC"; // soft teal
            } else if (ent.type === "canteen") {
              fillBg = "#FBF0D9"; // warm mustard cream
            } else if (ent.type === "library") {
              fillBg = "#F7EDD9"; // book cream
            } else if (ent.type === "samvaad") {
              fillBg = "#FFF6E5"; // auditorium yellow cream
            } else if (ent.type === "gcr") {
              fillBg = "#FDE9E6"; // soft coral
            } else if (ent.type === "arena") {
              fillBg = "#FEECE9"; // event arena
            }

            // Facility filter check
            const matchesFacility =
              facilityFilter === "all" ||
              (facilityFilter === "lifts" && ent.type === "lift-lobby") ||
              (facilityFilter === "washrooms" &&
                (ent.type === "washroom-student" || ent.type === "washroom-staff")) ||
              (facilityFilter === "purifier" && ent.type === "purifier") ||
              (facilityFilter === "canteen" && ent.type === "canteen") ||
              (facilityFilter === "library" && ent.type === "library");

            const isDimmed = facilityFilter !== "all" && !matchesFacility;
            const isFacilityHighlighted =
              facilityFilter !== "all" && matchesFacility;

            if (isSelected) {
              strokeColor = "#EF4B35";
            } else if (isFacilityHighlighted) {
              strokeColor = "#008080";
            }

            const labelLines = getBlockLabelLines(ent.name, bw);
            const fontSize = bw > 250 ? 12.5 : bw > 160 ? 11 : 9.5;

            return (
              <g
                key={ent.id}
                onClick={() => onSelectEntity(ent.id)}
                className={cn(
                  "cursor-pointer group focus:outline-none transition-opacity duration-200",
                  isDimmed && "opacity-25"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${ent.name} (${ent.countLabel ?? ent.type})`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectEntity(ent.id);
                  }
                }}
              >
                {/* Block Rectangle */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx="10"
                  fill={fillBg}
                  stroke={strokeColor}
                  strokeWidth={isSelected || isFacilityHighlighted ? "3.5" : "2"}
                  strokeDasharray={ent.status === "to confirm" ? "6 3" : undefined}
                  className="transition-all duration-150 group-hover:filter group-hover:drop-shadow-[0_4px_6px_rgba(30,26,23,0.25)]"
                />

                {/* Primary Name Text with Smart Multi-Line Wrapping */}
                {labelLines.length === 1 ? (
                  <text
                    x={bx + bw / 2}
                    y={by + bh / 2 - (ent.countLabel ? 6 : 0)}
                    textAnchor="middle"
                    fill="#1E1A17"
                    fontSize={fontSize}
                    fontWeight="900"
                    fontFamily="var(--font-space-grotesk)"
                    className="pointer-events-none select-none uppercase tracking-tight"
                  >
                    {labelLines[0]}
                  </text>
                ) : (
                  <text
                    x={bx + bw / 2}
                    y={by + bh / 2 - (ent.countLabel ? 12 : 6)}
                    textAnchor="middle"
                    fill="#1E1A17"
                    fontSize={fontSize}
                    fontWeight="900"
                    fontFamily="var(--font-space-grotesk)"
                    className="pointer-events-none select-none uppercase tracking-tight"
                  >
                    <tspan x={bx + bw / 2} dy="0">
                      {labelLines[0]}
                    </tspan>
                    <tspan x={bx + bw / 2} dy="13">
                      {labelLines[1]}
                    </tspan>
                  </text>
                )}

                {/* Subtitle / Count / Relationship Label */}
                {ent.countLabel && (
                  <text
                    x={bx + bw / 2}
                    y={
                      by +
                      bh / 2 +
                      (labelLines.length > 1 ? 16 : 12)
                    }
                    textAnchor="middle"
                    fill={events.length > 0 ? "#EF4B35" : "#685F56"}
                    fontSize={bw > 180 ? "10" : "8.5"}
                    fontWeight="700"
                    fontFamily="var(--font-space-grotesk)"
                    className="pointer-events-none select-none"
                  >
                    {events.length > 0
                      ? `${events.length} event${events.length > 1 ? "s" : ""}${
                          hasLiveNow ? " · LIVE NOW" : ""
                        }`
                      : ent.countLabel}
                  </text>
                )}

                {/* Status indicator: To Confirm */}
                {ent.status === "to confirm" && (
                  <text
                    x={bx + bw / 2}
                    y={by + bh - 6}
                    textAnchor="middle"
                    fill="#C05621"
                    fontSize="8.5"
                    fontWeight="800"
                    fontFamily="var(--font-space-grotesk)"
                    className="pointer-events-none select-none tracking-wider"
                  >
                    [TO CONFIRM]
                  </text>
                )}

                {/* ==================================================== */}
                {/* PUSHPIN / BADGE ON ENTITY                            */}
                {/* ==================================================== */}
                {(events.length > 0 || isSelected) && (
                  <g transform={`translate(${bx + bw - 14}, ${by + 14})`}>
                    {hasLiveNow && (
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="#EF4B35"
                        opacity="0.35"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? "10" : "8"}
                      fill={
                        hasLiveNow
                          ? "#EF4B35"
                          : hasLater
                          ? "#F2B93B"
                          : "#1E1A17"
                      }
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mandatory Noticeboard Caption & Feedback Link in Dedicated Footer Bar */}
      <div className="shrink-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#E2D6C3] border-t-[1.5px] border-[#1E1A17]">
        <div className="flex items-center gap-2 text-xs font-black text-[#1E1A17]">
          <span className="text-[#EF4B35]">●</span>
          <span>Schematic, not to scale.</span>
          <span className="text-[#1E1A17]/60 font-semibold hidden sm:inline">
            (Reported student layout)
          </span>
        </div>

        {/* Feedback link (User requirement 7) */}
        <a
          href={`mailto:crescendo-map@frcrce.ac.in?subject=${encodeURIComponent(
            `FrCRCE Campus Map Feedback - ${floor.label}`
          )}&body=${encodeURIComponent(
            `Hi Crescendo Map Team,\n\nI have a correction for ${floor.label}:\n[Please describe the room or floor detail to update here]\n\nThank you!`
          )}`}
          onClick={() => onReportIssue(floor.label)}
          aria-label={`Report an issue for ${floor.label}`}
          className="flex items-center gap-1.5 text-xs font-bold text-[#EF4B35] bg-[#F4EFE3] hover:bg-white px-3 py-1.5 rounded-xl border border-[#1E1A17] shadow-[1.5px_1.5px_0px_#1E1A17] transition-all"
        >
          <Info className="size-3.5" />
          <span>Is something wrong here? Tell us</span>
        </a>
      </div>
    </div>
  );
}
