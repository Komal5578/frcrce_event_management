"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "purple" | "inverse";
const styles: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  purple: "rounded-full bg-purple text-on-purple hover:bg-purple-deep",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
  ghost: "text-ink hover:bg-brand-soft",
  danger: "bg-danger text-white hover:brightness-110",
  inverse: "rounded-full bg-white text-neutral-950 hover:bg-purple-soft",
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
        "inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-semibold transition duration-150 ease-out active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
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
