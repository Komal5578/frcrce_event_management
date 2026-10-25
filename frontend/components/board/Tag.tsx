import React from "react";
import { cn } from "@/lib/cn";
import { Clock, ShieldCheck, XCircle } from "lucide-react";

export type TagVariant = "mustard" | "teal" | "red";

interface TagProps {
  variant?: TagVariant;
  label: string;
  icon?: boolean;
  className?: string;
}

export function Tag({
  variant = "teal",
  label,
  icon = true,
  className,
}: TagProps) {
  const styles: Record<TagVariant, { bg: string; text: string; border: string; Icon: typeof Clock }> = {
    mustard: {
      bg: "bg-[#F2B93B]",
      text: "text-[#1E1A17]",
      border: "border-[#1E1A17]/30",
      Icon: Clock,
    },
    teal: {
      bg: "bg-[#B5DDD4]",
      text: "text-[#1E1A17]",
      border: "border-[#1E1A17]/30",
      Icon: ShieldCheck,
    },
    red: {
      bg: "bg-[#EF4B35]",
      text: "text-[#1E1A17]",
      border: "border-[#1E1A17]/30",
      Icon: XCircle,
    },
  };

  const { bg, text, border, Icon } = styles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider",
        "border leading-normal",
        bg,
        text,
        border,
        className
      )}
    >
      {icon ? <Icon className="size-3 shrink-0" aria-hidden="true" /> : null}
      <span>{label}</span>
    </span>
  );
}

export function statusToTagVariant(status: string): TagVariant {
  const s = status.toLowerCase();
  if (["pending", "draft", "returned", "waitlisted", "todo", "doing"].includes(s)) {
    return "mustard";
  }
  if (["approved", "open", "ongoing", "completed", "done", "registered"].includes(s)) {
    return "teal";
  }
  if (["declined", "cancelled", "overdue", "clash", "full"].includes(s)) {
    return "red";
  }
  return "mustard";
}
