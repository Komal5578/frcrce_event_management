import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-[var(--radius-card)] bg-surface shadow-card border border-line", className)} {...p} />;
}

export function CardHeader({ title, aside, className }: { title: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-4", className)}>
      <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
      {aside}
    </div>
  );
}
