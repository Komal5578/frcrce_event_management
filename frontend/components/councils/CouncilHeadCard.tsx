"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { CouncilHead } from "@/lib/demo/councils";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMe } from "@/lib/session";

interface CouncilHeadCardProps {
  head: CouncilHead;
  councilName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCoreMembers?: number;
}

export function CouncilHeadCard({
  head,
  councilName,
  size = "md",
  className,
  showCoreMembers,
}: CouncilHeadCardProps) {
  const { me } = useMe();
  const [imgError, setImgError] = useState(false);

  // Privacy Rule (Step 8): Council head details and photos are visible only to signed-in users.
  if (!me) {
    return (
      <div className={cn("rounded-xl border border-dashed border-[#1E1A17]/30 bg-[#D9CBB3]/30 p-2.5 text-xs text-[#1E1A17]/70", className)}>
        <span className="font-semibold">Sign in to view council head details</span>
      </div>
    );
  }

  const avatarSizes = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-16 text-base",
  };

  const photoSizes = {
    sm: 36,
    md: 48,
    lg: 64,
  };

  const hasPhoto = Boolean(head.photo && !imgError);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#1E1A17]/25 bg-white p-3 shadow-[1.5px_1.5px_0px_#1E1A17]",
        size === "lg" && "p-4",
        className
      )}
    >
      {/* Avatar or Photo */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-[#1E1A17] bg-[#D9CBB3] grid place-items-center font-grotesk font-black text-[#1E1A17]",
          avatarSizes[size]
        )}
      >
        {hasPhoto ? (
          <Image
            src={head.photo!}
            alt={`${head.name}, ${head.role} of ${councilName}`}
            width={photoSizes[size]}
            height={photoSizes[size]}
            className="size-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-hidden="true">{initials(head.name)}</span>
        )}
      </div>

      {/* Head Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-grotesk font-bold text-[#1E1A17] text-sm leading-tight">
            {head.name}
          </span>
          {!head.verified && (
            <span
              className="inline-block px-1.5 py-0.2 rounded bg-[#EF4B35] text-[10px] font-black uppercase tracking-wider text-white border border-[#1E1A17] shadow-[1px_1px_0px_#1E1A17]"
              title="Demo fictitious name, unverified"
            >
              DEMO
            </span>
          )}
        </div>

        <div className="mt-0.5 text-xs font-semibold text-[#1E1A17]/75 truncate">
          {head.role}
        </div>

        {typeof showCoreMembers === "number" && (
          <div className="mt-1 text-[11px] font-bold text-[#1E1A17]/60">
            {showCoreMembers} core council members
          </div>
        )}
      </div>
    </div>
  );
}
