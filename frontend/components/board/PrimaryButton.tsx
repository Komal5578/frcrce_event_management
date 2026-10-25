import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "red" | "mustard" | "teal" | "cream";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function PrimaryButton({
  href,
  variant = "red",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const variantStyles = {
    red: "bg-[#EF4B35] text-white hover:bg-[#E33B25]",
    mustard: "bg-[#F2B93B] text-[#1E1A17] hover:bg-[#E5AC2E]",
    teal: "bg-[#B5DDD4] text-[#1E1A17] hover:bg-[#A3D1C7]",
    cream: "bg-[#F4EFE3] text-[#1E1A17] hover:bg-[#EBE4D5]",
  }[variant];

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-sm min-h-9",
    md: "px-5 py-2.5 text-base min-h-11",
    lg: "px-7 py-3.5 text-lg min-h-13",
  }[size];

  const commonClasses = cn(
    "inline-flex items-center justify-center gap-2 font-grotesk font-bold rounded-lg border-[1.5px] border-[#1E1A17]",
    "shadow-[4px_4px_0px_#1E1A17] transition-all duration-150 cursor-pointer select-none",
    "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1E1A17]",
    "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
    "focus-visible:outline-3 focus-visible:outline-[#1E1A17] focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-[2px_2px_0px_#1E1A17]",
    variantStyles,
    sizeStyles,
    className
  );

  if (href) {
    return (
      <Link href={href} className={commonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={commonClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
