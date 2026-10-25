import React from "react";
import { cn } from "@/lib/cn";

export interface TabLabel {
  id: string;
  label: string;
  count?: number;
}

interface BoardSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  sub?: string;
  annotation?: string;
  tabs?: TabLabel[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function BoardSection({
  children,
  className,
  title,
  sub,
  annotation,
  tabs,
  activeTab,
  onTabChange,
}: BoardSectionProps) {
  return (
    <section className="relative w-full">
      {/* Tab-shaped labels on the board's edge */}
      {tabs && tabs.length > 0 && (
        <div
          role="tablist"
          aria-label="Department filters"
          className="relative z-10 -mb-[1.5px] flex flex-wrap items-end gap-1.5 px-4 sm:px-8 overflow-x-auto [scrollbar-width:none]"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "cursor-pointer rounded-t-lg border-[1.5px] border-b-0 border-[#1E1A17] px-3.5 py-1.5 text-xs font-bold font-grotesk tracking-wide uppercase transition-all",
                  "focus-visible:outline-2 focus-visible:outline-[#1E1A17]",
                  isActive
                    ? "bg-[#D9CBB3] text-[#1E1A17] shadow-sm translate-y-0 pb-2 border-b-transparent z-10"
                    : "bg-[#E8DFC8] text-[#1E1A17]/75 hover:bg-[#D9CBB3]/80 hover:text-[#1E1A17] translate-y-1"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined ? (
                  <span className="ml-1.5 opacity-70">({tab.count})</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Noticeboard Tan Panel with faint dot texture & thin dark border */}
      <div
        className={cn(
          "relative rounded-2xl sm:rounded-3xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-4 sm:p-6 md:p-8",
          "shadow-[3px_4px_0px_rgba(30,26,23,0.15)]",
          className
        )}
        style={{
          backgroundImage: "radial-gradient(#1E1A17 0.85px, transparent 0.85px)",
          backgroundSize: "18px 18px",
        }}
      >
        {/* Subtle wooden/cork frame pins at top corners */}
        <div
          aria-hidden="true"
          className="absolute top-3 left-3 size-3 rounded-full bg-[#EF4B35] border border-[#1E1A17] shadow-[1px_1px_2px_rgba(30,26,23,0.3)]"
        />
        <div
          aria-hidden="true"
          className="absolute top-3 right-3 size-3 rounded-full bg-[#EF4B35] border border-[#1E1A17] shadow-[1px_1px_2px_rgba(30,26,23,0.3)]"
        />

        {/* Optional Header inside board */}
        {(title || sub || annotation) && (
          <div className="relative mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-[#1E1A17]/15 pb-4">
            <div>
              {sub && (
                <p className="font-grotesk text-xs uppercase tracking-wider font-bold text-[#1E1A17]/70">
                  {sub}
                </p>
              )}
              {title && (
                <h2 className="font-grotesk text-2xl sm:text-3xl font-extrabold tracking-[-0.01em] leading-[0.98] text-[#1E1A17]">
                  {title}
                </h2>
              )}
            </div>
            {annotation && (
              <span className="font-script text-lg sm:text-xl font-bold text-[#EF4B35] rotate-[-2deg]">
                {annotation}
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
