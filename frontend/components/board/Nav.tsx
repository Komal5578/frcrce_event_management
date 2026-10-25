"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Pin } from "lucide-react";
import { cn } from "@/lib/cn";
import { PrimaryButton } from "./PrimaryButton";
import { useMe } from "@/lib/session";

export function Nav() {
  const pathname = usePathname();
  const { me } = useMe();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Noticeboard" },
    { href: "/events", label: "Events" },
    { href: "/map", label: "Campus Map" },
    { href: "/student", label: "Student Portal" },
    { href: "/coordinator", label: "Faculty & Staff" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-[1.5px] border-[#1E1A17] bg-[#F4EFE3]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-[#1E1A17] rounded-md"
        >
          <div className="grid size-9 place-items-center rounded bg-[#EF4B35] border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] text-white">
            <Pin className="size-5 -rotate-45" />
          </div>
          <div>
            <span className="font-grotesk text-lg sm:text-xl font-black tracking-[-0.01em] text-[#1E1A17] block leading-none">
              FrCRCE Events
            </span>
            <span className="font-script text-xs sm:text-sm font-bold text-[#EF4B35] block leading-none mt-0.5">
              Campus Noticeboard
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main" className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-grotesk text-sm font-bold px-3 py-1.5 rounded-md transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-[#1E1A17]",
                  active
                    ? "bg-[#D9CBB3] text-[#1E1A17] border border-[#1E1A17]/40 shadow-sm"
                    : "text-[#1E1A17]/80 hover:text-[#1E1A17] hover:bg-[#D9CBB3]/40"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-2.5">
          {me ? (
            <Link
              href={
                me.role === "admin"
                  ? "/admin"
                  : me.role === "coordinator"
                  ? "/coordinator"
                  : "/student"
              }
              className="font-grotesk text-xs uppercase font-extrabold px-3 py-2 border border-[#1E1A17] rounded bg-[#B5DDD4] text-[#1E1A17]"
            >
              {me.name} ({me.role})
            </Link>
          ) : (
            <PrimaryButton href="/login" size="sm" variant="red">
              Sign In
            </PrimaryButton>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg border border-[#1E1A17] bg-[#F4EFE3] text-[#1E1A17] focus-visible:outline-2 focus-visible:outline-[#1E1A17]"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1E1A17]/20 bg-[#F4EFE3] px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block font-grotesk text-base font-bold px-3 py-2 rounded-md",
                  active
                    ? "bg-[#D9CBB3] text-[#1E1A17] border border-[#1E1A17]/40"
                    : "text-[#1E1A17]/80 hover:bg-[#D9CBB3]/40"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <PrimaryButton
              href="/login"
              size="md"
              variant="red"
              className="w-full"
              onClick={() => setMobileOpen(false)}
            >
              {me ? "Dashboard" : "Sign In to Board"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </header>
  );
}
