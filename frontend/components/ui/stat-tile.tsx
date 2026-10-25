"use client";

import { cn } from "@/lib/cn";
import { CountUp } from "./motion";

type Tone = "green" | "red" | "amber" | "slate" | "blue";
const tone: Record<Tone, string> = {
  green: "bg-[#B5DDD4] text-[#1E1A17]",
  red: "bg-[#EF4B35] text-white",
  amber: "bg-[#F2B93B] text-[#1E1A17]",
  slate: "bg-[#D9CBB3] text-[#1E1A17]",
  blue: "bg-[#B5DDD4] text-[#1E1A17]",
};

/** Big coloured number over a plain label, calm and readable with thin border */
export function StatTile({
  label, value, suffix, tone: t = "slate", note, decimals, big,
}: { label: string; value: number; suffix?: string; tone?: Tone; note?: string; decimals?: number; big?: boolean }) {
  return (
    <div className={cn("h-full rounded-xl px-5 py-4 border-[1.5px] border-[#1E1A17]/25 shadow-sm", tone[t])}>
      <p className={cn("font-grotesk font-black leading-none tracking-[-0.01em]", big ? "text-[44px]" : "text-[34px]")}>
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-2 text-sm font-bold font-grotesk">{label}</p>
      {note ? <p className="mt-0.5 text-xs font-semibold opacity-80">{note}</p> : null}
    </div>
  );
}
