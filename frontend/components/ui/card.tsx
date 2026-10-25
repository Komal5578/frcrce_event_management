import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl bg-white border-[1.5px] border-[#1E1A17]/25 shadow-sm p-4 sm:p-5",
        className
      )}
      {...p}
    />
  );
}

export function CardHeader({
  title,
  aside,
  className,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 pb-3 border-b border-[#1E1A17]/15", className)}>
      <h2 className="font-grotesk text-base font-extrabold tracking-[-0.01em] text-[#1E1A17]">{title}</h2>
      {aside}
    </div>
  );
}
