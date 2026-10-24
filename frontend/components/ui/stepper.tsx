"use client";

import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Step = { label: string; icon: LucideIcon; hint?: string };

/** The mockup's workflow strip: icon tiles joined by arrows. Done / current / upcoming are icon + word + fill. */
export function Stepper({ steps, current, compact }: { steps: Step[]; current: number; compact?: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-3" aria-label="Progress">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        const Icon = state === "done" ? Check : s.icon;
        return (
          <li key={s.label} className="flex items-center" aria-current={state === "now" ? "step" : undefined}>
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-colors",
                state === "now" && "border-brand bg-brand text-on-brand",
                state === "done" && "border-transparent bg-good-soft text-good",
                state === "next" && "border-line bg-surface text-muted",
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={state === "next" ? 2 : 2.4} aria-hidden />
              <span className={cn("text-sm font-semibold", compact && "max-sm:sr-only")}>{s.label}</span>
              <span className="sr-only">{state === "done" ? " (done)" : state === "now" ? " (current step)" : " (not yet)"}</span>
            </div>
            {i < steps.length - 1 ? <ChevronRight className="mx-1 size-4 shrink-0 text-faint" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
