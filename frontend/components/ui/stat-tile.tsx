"use client";

import { cn } from "@/lib/cn";
import { CountUp } from "./motion";

type Tone = "green" | "red" | "amber" | "slate" | "blue";
const tone: Record<Tone, string> = {
  green: "bg-[var(--st-open-bg)] text-[var(--st-open-fg)]",
  red: "bg-[var(--st-cancelled-bg)] text-[var(--st-cancelled-fg)]",
  amber: "bg-[var(--st-pending-bg)] text-[var(--st-pending-fg)]",
  slate: "bg-[var(--st-completed-bg)] text-[var(--st-completed-fg)]",
  blue: "bg-[var(--st-approved-bg)] text-[var(--st-approved-fg)]",
};

/** Big coloured number over a plain label, as in the original mockup's stat tiles. */
export function StatTile({
  label, value, suffix, tone: t = "slate", note, decimals, big,
}: { label: string; value: number; suffix?: string; tone?: Tone; note?: string; decimals?: number; big?: boolean }) {
  return (
    <div className={cn("h-full rounded-2xl px-5 py-4 border border-black/[.04]", tone[t])}>
      <p className={cn("font-extrabold leading-none tracking-tight", big ? "text-[44px]" : "text-[34px]")}>
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      {note ? <p className="mt-0.5 text-[13px] opacity-85">{note}</p> : null}
    </div>
  );
}
