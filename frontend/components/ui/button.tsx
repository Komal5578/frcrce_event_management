"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "purple" | "inverse";
const styles: Record<Variant, string> = {
  primary: "bg-[#EF4B35] text-white border border-[#1E1A17] hover:bg-[#DB3D28] font-grotesk font-bold",
  purple: "bg-[#1E1A17] text-white hover:bg-[#2B2521] font-grotesk font-bold",
  secondary: "bg-white text-[#1E1A17] border border-[#1E1A17]/30 hover:border-[#1E1A17] font-grotesk font-bold",
  ghost: "text-[#1E1A17] hover:bg-[#1E1A17]/10 font-bold",
  danger: "bg-[#EF4B35] text-white hover:brightness-110 font-bold",
  inverse: "bg-[#F4EFE3] text-[#1E1A17] border border-[#1E1A17] hover:bg-[#D9CBB3] font-bold",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg" | "sm";
  loading?: boolean;
  full?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, full, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 ease-out active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 cursor-pointer",
        size === "sm" ? "min-h-11 px-3.5 text-sm" : size === "lg" ? "min-h-14 px-6 text-base" : "min-h-11 px-4.5 text-[15px]",
        styles[variant],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {loading ? "Working…" : children}
    </button>
  );
});
