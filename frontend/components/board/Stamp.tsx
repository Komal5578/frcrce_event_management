import React from "react";
import { cn } from "@/lib/cn";

export type StampVariant = "registered" | "approved" | "declined" | "pending";

interface StampProps {
  label?: string;
  variant?: StampVariant;
  className?: string;
  animate?: boolean;
}

export function Stamp({
  label,
  variant = "registered",
  className,
  animate = false,
}: StampProps) {
  const text = label ?? variant.toUpperCase();

  const variantStyles: Record<StampVariant, string> = {
    registered: "text-[#EF4B35] border-[#EF4B35]",
    approved: "text-[#1B7F6B] border-[#1B7F6B]",
    declined: "text-[#EF4B35] border-[#EF4B35]",
    pending: "text-[#C2820B] border-[#C2820B]",
  };

  return (
    <div
      role="status"
      aria-label={`Status: ${text}`}
      className={cn(
        "pointer-events-none select-none inline-block border-[2.5px] border-dashed rounded px-2.5 py-1",
        "font-grotesk text-sm font-black tracking-widest uppercase leading-none",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]",
        variantStyles[variant],
        animate ? "animate-stamp-thud" : "-rotate-6",
        className
      )}
      style={{
        maskImage: "radial-gradient(circle at center, black 85%, transparent 100%)",
      }}
    >
      ★ {text} ★
    </div>
  );
}
