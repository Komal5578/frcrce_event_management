"use client";

import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Step = { label: string; icon: LucideIcon; hint?: string };

/** The mockup's workflow strip: icon tiles joined by arrows. Done / current / upcoming are icon + word + fill. */
export function Stepper({ steps, current, compact, tight }: { steps: Step[]; current: number; compact?: boolean; tight?: boolean }) {
  return (
    <ol className={cn("flex items-center", tight ? "flex-nowrap" : "flex-wrap gap-y-3")} aria-label="Progress">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        const Icon = state === "done" ? Check : s.icon;
        return (
          <li key={s.label} className="flex items-center" aria-current={state === "now" ? "step" : undefined}>
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl py-2 border transition-colors", tight ? "px-2.5" : "px-3",
                state === "now" && "border-ice bg-ice text-neutral-950",
                state === "done" && "border-transparent bg-good-soft text-good",
                state === "next" && "border-line bg-surface text-muted",
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={state === "next" ? 2 : 2.4} aria-hidden />
              <span className={cn("text-sm font-semibold", compact && "max-sm:sr-only")}>{s.label}</span>
              <span className="sr-only">{state === "done" ? " (done)" : state === "now" ? " (current step)" : " (not yet)"}</span>
            </div>
            {i < steps.length - 1 ? <ChevronRight className={cn("size-4 shrink-0 text-faint", tight ? "mx-0.5" : "mx-1")} aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
