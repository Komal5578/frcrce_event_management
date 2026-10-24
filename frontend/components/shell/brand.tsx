import { CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function BrandMark({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-[10px]", onDark ? "bg-ice text-neutral-950" : "bg-brand text-mark-fg", className)}>
      <CalendarCheck2 className="size-5" strokeWidth={2.3} aria-hidden />
    </span>
  );
}

export const BRAND = "CampusEvent";
