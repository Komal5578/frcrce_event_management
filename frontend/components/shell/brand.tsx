import { CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-xl bg-brand-solid text-white", className)}>
      <CalendarCheck2 className="size-5" strokeWidth={2.3} aria-hidden />
    </span>
  );
}

export const BRAND = "CampusEvent";
