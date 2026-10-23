"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary:     "bg-accent text-accent-contrast border border-accent hover:bg-accent-hover",
  secondary:   "bg-surface text-ink border border-border-ui hover:bg-panel",
  destructive: "bg-destructive text-destructive-contrast border border-destructive hover:bg-destructive-hover",
  ghost:       "bg-transparent text-ink border border-transparent hover:bg-panel",
  link:        "bg-transparent text-accent border-none underline underline-offset-4 hover:text-accent-hover p-0 min-h-0 min-w-0",
} as const;

const SIZES = {
  sm: "min-h-9 min-w-9 px-3 py-1.5 text-fine",
  md: "min-h-11 min-w-11 px-4 py-2 text-label",
  lg: "min-h-14 min-w-11 px-5 py-3 text-body",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  /** When true, renders as a Radix Slot, merging props onto the child element (e.g. Next.js Link). */
  asChild?: boolean;
};

/**
 * Polymorphic button with Tailwind variants, size scale, loading state, and
 * optional `asChild` for link-styled buttons (e.g. Next.js `<Link>`).
 *
 * Usage with Link:
 *   <Button asChild variant="secondary"><Link href="/foo">Go</Link></Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    disabled,
    onClick,
    className = "",
    children,
    type = "button",
    asChild = false,
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const inactive = disabled || loading;

  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-150",
    VARIANTS[variant],
    SIZES[size],
    inactive ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild) {
    return (
      <Comp ref={ref as never} className={classes} {...rest}>
        {children}
      </Comp>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (inactive) return e.preventDefault();
        onClick?.(e);
      }}
      className={classes}
      {...rest}
    >
      {loading ? "Working…" : children}
    </button>
  );
});
