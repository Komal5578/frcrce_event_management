import React from "react";
import { cn } from "@/lib/cn";

interface TapeProps {
  className?: string;
  position?: "top" | "top-left" | "top-right" | "left" | "right";
  rotate?: string;
}

export function Tape({ className, position = "top", rotate }: TapeProps) {
  const positionClasses = {
    top: "-top-3.5 left-1/2 -translate-x-1/2",
    "top-left": "-top-3 -left-3 rotate-[-12deg]",
    "top-right": "-top-3 -right-3 rotate-[12deg]",
    left: "top-1/2 -left-4 -translate-y-1/2 -rotate-90",
    right: "top-1/2 -right-4 -translate-y-1/2 rotate-90",
  }[position];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-20 h-6 w-24",
        "bg-[#FAF7EF]/85 border border-[#1E1A17]/15",
        "shadow-[0_1px_3px_rgba(30,26,23,0.12)] backdrop-blur-[1px]",
        "transition-transform duration-300 ease-out group-hover:scale-y-110 group-hover:-translate-y-1",
        positionClasses,
        rotate,
        className
      )}
      style={{
        clipPath:
          "polygon(0% 12%, 4% 0%, 96% 2%, 100% 14%, 98% 88%, 94% 100%, 3% 98%, 0% 86%)",
      }}
    />
  );
}
