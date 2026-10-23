"use client";

import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-accent text-white border border-accent",
  secondary: "bg-surface text-ink border border-border-ui",
  destructive: "bg-destructive text-white border border-destructive",
  ghost: "bg-transparent text-ink border border-transparent",
} as const;

const SIZES = { md: "min-h-11 min-w-11 px-4 py-2", lg: "min-h-14 min-w-11 px-4 py-2" } as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, disabled, onClick, className = "", children, type = "button", ...rest }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <button
      type={type}
      {...rest}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (inactive) return e.preventDefault();
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-control text-label font-semibold transition-colors duration-150 ${VARIANTS[variant]} ${SIZES[size]} ${inactive ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {loading ? "Working..." : children}
    </button>
  );
}
