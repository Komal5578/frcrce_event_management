"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tape } from "./Tape";
import { Stamp, type StampVariant } from "./Stamp";

export type FlyerColor = "cream" | "mustard" | "teal" | "red";

export interface FlyerProps {
  id?: string;
  title: string;
  date: string;
  time?: string;
  room?: string;
  seatsLeft?: number | null;
  capacity?: number | null;
  department?: string | null;
  colorVariant?: FlyerColor;
  tiltDegree?: number; // 1 to 3 or -1 to -3
  tapePosition?: "top" | "top-left" | "top-right";
  isFlipped?: boolean; // When non-matching filter, flip face down
  stamp?: { text: string; variant?: StampVariant; animate?: boolean } | null;
  href?: string;
  actionText?: string;
  annotation?: string; // Cheeky handwritten note
  className?: string;
  onClick?: () => void;
}

export function Flyer({
  id,
  title,
  date,
  time,
  room,
  seatsLeft,
  capacity,
  department,
  colorVariant = "cream",
  tiltDegree = 1.5,
  tapePosition = "top",
  isFlipped = false,
  stamp,
  href,
  actionText = "Grab seat →",
  annotation,
  className,
  onClick,
}: FlyerProps) {
  const router = useRouter();

  // WCAG AA contrast colors: ink black #1E1A17 on all variants
  const colorStyles: Record<FlyerColor, { bg: string; text: string; badge: string; border: string }> = {
    cream: {
      bg: "bg-[#F4EFE3]",
      text: "text-[#1E1A17]",
      badge: "bg-[#1E1A17]/10 text-[#1E1A17]",
      border: "border-[#1E1A17]",
    },
    mustard: {
      bg: "bg-[#F2B93B]",
      text: "text-[#1E1A17]",
      badge: "bg-[#1E1A17]/15 text-[#1E1A17]",
      border: "border-[#1E1A17]",
    },
    teal: {
      bg: "bg-[#B5DDD4]",
      text: "text-[#1E1A17]",
      badge: "bg-[#1E1A17]/15 text-[#1E1A17]",
      border: "border-[#1E1A17]",
    },
    red: {
      // Tomato Red with ink black gives 4.73:1 (passes WCAG AA >= 4.5:1)
      bg: "bg-[#EF4B35]",
      text: "text-[#1E1A17]",
      badge: "bg-[#1E1A17]/15 text-[#1E1A17]",
      border: "border-[#1E1A17]",
    },
  };

  const style = colorStyles[colorVariant];

  // Specific tilt rotation string for inline CSS transform
  const normalTransform = `rotate(${tiltDegree}deg)`;

  const content = (
    <div
      className={cn(
        "group relative w-full h-full card-3d-wrap",
        className
      )}
    >
      {/* 3D Flip Container: flips face down when isFlipped is true */}
      <div
        className={cn(
          "card-3d-inner",
          isFlipped
            ? "opacity-65"
            : "hover:-translate-y-2 hover:rotate-0!"
        )}
        style={{
          transform: isFlipped ? "rotateY(180deg)" : normalTransform,
        }}
      >
        {/* FRONT OF FLYER */}
        <div
          className={cn(
            "card-3d-front relative flex flex-col justify-between p-5 sm:p-6 rounded-lg border-[1.5px] border-[#1E1A17]",
            "shadow-[2px_5px_12px_rgba(30,26,23,0.1)] transition-shadow duration-300",
            "group-hover:shadow-[4px_12px_24px_rgba(30,26,23,0.16)]",
            style.bg,
            style.text,
            style.border
          )}
        >
          {/* Masking tape on top edge */}
          <Tape position={tapePosition} />

          {/* Stamped badge if provided */}
          {stamp && (
            <div className="absolute -top-2 right-4 z-20 pointer-events-none">
              <Stamp
                label={stamp.text}
                variant={stamp.variant ?? "registered"}
                animate={stamp.animate}
              />
            </div>
          )}

          {/* Department badge / annotation */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {department ? (
              <span
                className={cn(
                  "font-grotesk text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-[#1E1A17]/30",
                  style.badge
                )}
              >
                {department}
              </span>
            ) : <span />}

            {annotation && (
              <span className="font-script text-base font-bold text-[#1E1A17] rotate-[-3deg]">
                {annotation}
              </span>
            )}
          </div>

          {/* Title: heavy grotesque, letter-spacing -0.01em, line-height 0.98 */}
          <div className="my-2">
            <h3 className="font-grotesk text-xl sm:text-2xl font-black tracking-[-0.01em] leading-[0.98] text-[#1E1A17] line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Date, Time, Room, Seats Left: fully visible and clear */}
          <div className="mt-3 space-y-1.5 text-sm font-semibold text-[#1E1A17]/90 border-t border-[#1E1A17]/20 pt-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-[#1E1A17]/70" aria-hidden="true" />
              <span>
                <strong className="font-bold text-[#1E1A17]">{date}</strong>
                {time ? ` · ${time}` : ""}
              </span>
            </div>

            {room && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="size-4 shrink-0 text-[#1E1A17]/70" aria-hidden="true" />
                  <span className="truncate">{room}</span>
                </div>
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(id ? `/map?event=${encodeURIComponent(id)}` : "/map");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(id ? `/map?event=${encodeURIComponent(id)}` : "/map");
                    }
                  }}
                  className="shrink-0 font-grotesk text-[11px] font-black text-[#EF4B35] hover:underline underline-offset-2 flex items-center gap-0.5 ml-auto cursor-pointer"
                >
                  Where is this? 📍
                </span>
              </div>
            )}

            {seatsLeft !== undefined && seatsLeft !== null && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Users className="size-3.5 shrink-0 text-[#1E1A17]/70" aria-hidden="true" />
                  <span>
                    {seatsLeft === 0 ? (
                      <span className="text-[#1E1A17] bg-[#EF4B35]/30 px-1.5 py-0.5 rounded font-black">
                        Waitlist only
                      </span>
                    ) : (
                      <span>
                        <strong className="font-black text-[#1E1A17]">{seatsLeft}</strong>
                        {capacity ? ` / ${capacity}` : ""} seats left
                      </span>
                    )}
                  </span>
                </div>

                <span className="font-grotesk text-xs font-black underline underline-offset-2 decoration-[#1E1A17]/50 group-hover:decoration-[#1E1A17]">
                  {actionText}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* BACK OF FLYER (Visible when face down / flipped) */}
        <div
          className={cn(
            "card-3d-back flex flex-col items-center justify-center p-5 rounded-lg border-[1.5px] border-[#1E1A17]",
            "bg-[#D9CBB3] text-[#1E1A17] shadow-md"
          )}
          style={{
            backgroundImage: "radial-gradient(#1E1A17 0.6px, transparent 0.6px)",
            backgroundSize: "12px 12px",
          }}
        >
          <div className="border border-[#1E1A17]/30 rounded p-4 text-center max-w-[200px]">
            <p className="font-grotesk text-xs font-bold uppercase tracking-widest text-[#1E1A17]/50">
              Noticeboard Flyer
            </p>
            <p className="font-script text-base text-[#1E1A17]/70 mt-1">
              (Flipped face down)
            </p>
            <p className="text-[11px] text-[#1E1A17]/50 mt-1">
              Tap department above to reveal
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="block focus-visible:outline-2 focus-visible:outline-[#1E1A17] rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      {content}
    </div>
  );
}
