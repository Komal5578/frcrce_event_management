"use client";

import { cn } from "@/lib/cn";
import { CountUp } from "./motion";

type Tone = "green" | "red" | "amber" | "slate" | "blue";
const tone: Record<Tone, string> = {
  green: "text-[var(--st-open-fg)]",
  red: "text-[var(--st-cancelled-fg)]",
  amber: "text-[var(--st-pending-fg)]",
  slate: "text-ink",
  blue: "text-[var(--st-approved-fg)]",
};

/** Linear-style metric: quiet label, one confident figure. Colour sits on the number only, never the whole tile. */
export function StatTile({
  label, value, suffix, tone: t = "slate", note, decimals, big,
}: { label: string; value: number; suffix?: string; tone?: Tone; note?: string; decimals?: number; big?: boolean }) {
  return (
    <div className="h-full rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card">
      <p className="text-[13.5px] font-medium text-muted">{label}</p>
      <p className={cn("mt-2 font-semibold leading-none tracking-[-0.03em]", big ? "text-[44px]" : "text-[34px]", tone[t])}>
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </p>
      {note ? <p className="mt-1.5 text-[13px] text-muted">{note}</p> : null}
    </div>
  );
}
