"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/cn";
import type { TabLabel } from "./BoardSection";

interface CouncilLadderProps {
  councils: TabLabel[];
  activeDept: string;
  onSelectDept: (deptId: string) => void;
  direction: "up" | "down";
  side: "left" | "right";
  pinnedHeader?: React.ReactNode;
  className?: string;
}

export function CouncilLadder({
  councils,
  activeDept,
  onSelectDept,
  direction,
  side,
  pinnedHeader,
  className,
}: CouncilLadderProps) {
  // Ensure the list has sufficient items so that one half comfortably fills the ladder viewport
  const baseList = useMemo(() => {
    if (councils.length === 0) return [];
    let items = [...councils];
    while (items.length < 8) {
      items = [...items, ...councils];
    }
    return items;
  }, [councils]);

  const renderTab = (
    council: TabLabel,
    key: string,
    isDuplicate: boolean = false
  ) => {
    const isActive = activeDept === council.id;

    return (
      <button
        key={key}
        type="button"
        role="tab"
        aria-pressed={isActive}
        tabIndex={isDuplicate ? -1 : 0}
        aria-hidden={isDuplicate ? true : undefined}
        onClick={() => onSelectDept(council.id)}
        className={cn(
          "group/rung relative z-10 w-full rounded-lg border-[1.5px] px-3 py-2 text-left font-grotesk text-xs uppercase tracking-wide font-extrabold transition-all duration-100 ease-out cursor-pointer select-none",
          "focus-visible:outline-2 focus-visible:outline-[#1E1A17] focus-visible:outline-offset-1",
          "flex items-center justify-between gap-1.5",
          isActive
            ? cn(
                "bg-[#EF4B35] text-[#F4EFE3] border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17]",
                side === "left" ? "translate-x-[6px]" : "-translate-x-[6px]"
              )
            : "bg-[#E8DFC8] text-[#1E1A17] border-[#1E1A17] hover:bg-[#D9CBB3] hover:shadow-[2px_2px_0px_rgba(30,26,23,0.3)] shadow-[1px_1px_0px_rgba(30,26,23,0.25)]"
        )}
      >
        <span className="truncate" title={council.label}>
          {council.label}
        </span>
        {council.count !== undefined && (
          <span
            className={cn(
              "shrink-0 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded",
              isActive
                ? "bg-[#1E1A17] text-[#F4EFE3]"
                : "bg-[#1E1A17]/10 text-[#1E1A17]"
            )}
          >
            {council.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "ladder-container relative flex flex-col h-[calc(100vh-8rem)] max-h-[760px] min-h-[520px] select-none",
        className
      )}
      aria-label={side === "left" ? "Left council filter ladder" : "Right council filter ladder"}
    >
      {/* Ladder Left Rail (1.5px ink line behind tabs with top/bottom pegs) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3.5 w-[1.5px] bg-[#1E1A17] z-0"
      >
        <div className="absolute -top-1 -left-[3.25px] size-2 rounded-full bg-[#1E1A17] border border-[#F4EFE3]" />
        <div className="absolute -bottom-1 -left-[3.25px] size-2 rounded-full bg-[#1E1A17] border border-[#F4EFE3]" />
      </div>

      {/* Ladder Right Rail (1.5px ink line behind tabs with top/bottom pegs) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3.5 w-[1.5px] bg-[#1E1A17] z-0"
      >
        <div className="absolute -top-1 -left-[3.25px] size-2 rounded-full bg-[#1E1A17] border border-[#F4EFE3]" />
        <div className="absolute -bottom-1 -left-[3.25px] size-2 rounded-full bg-[#1E1A17] border border-[#F4EFE3]" />
      </div>

      {/* Pinned Top: Stays pinned above the scrolling rungs */}
      {pinnedHeader && (
        <div className="relative z-20 shrink-0 pb-3 bg-gradient-to-b from-[#F4EFE3] via-[#F4EFE3] to-transparent">
          {pinnedHeader}
        </div>
      )}

      {/* Continuous scrolling ladder track with soft edge mask */}
      <div className="relative flex-1 overflow-hidden ladder-mask">
        <div
          className={cn(
            "ladder-track flex flex-col",
            direction === "up" ? "ladder-scroll-up" : "ladder-scroll-down"
          )}
        >
          {/* Half 1: Interactive accessible buttons */}
          <div className="flex flex-col gap-2.5 pb-2.5">
            {baseList.map((c, idx) => renderTab(c, `c-1-${c.id}-${idx}`, false))}
          </div>

          {/* Half 2: Seamless loop duplicate (aria-hidden for screen readers, tabIndex=-1) */}
          <div
            className="ladder-duplicate flex flex-col gap-2.5 pb-2.5"
            aria-hidden="true"
          >
            {baseList.map((c, idx) => renderTab(c, `c-2-${c.id}-${idx}`, true))}
          </div>
        </div>
      </div>
    </aside>
  );
}
