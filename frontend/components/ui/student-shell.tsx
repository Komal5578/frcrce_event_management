"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { X, Menu } from "lucide-react";
import { Button } from "./button";
import { TextSizeControl } from "./text-size-control";
import { ThemeToggle } from "./theme-toggle";
import { isNavActive, type NavItem } from "./app-shell";

/** Bottom tab item (shown on mobile < lg). Subset of nav items — first 4. */
function BottomTab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-fine font-medium transition-colors duration-150",
        active ? "text-accent" : "text-muted hover:text-ink",
      ].join(" ")}
    >
      <span aria-hidden="true" className="[&>svg]:size-5">
        {item.icon}
      </span>
      <span className="max-w-16 truncate text-center leading-none">{item.label}</span>
    </Link>
  );
}

function Sidebar({
  productName,
  roleLabel,
  userName,
  navItems,
  signOut,
  pathname,
}: {
  productName: string;
  roleLabel: string;
  userName: string;
  navItems: NavItem[];
  signOut: () => Promise<void>;
  pathname: string;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-border-card px-6 py-5">
        <div>
          <p className="text-label font-bold tracking-tight text-ink">{productName}</p>
          <p className="mt-0.5 text-fine text-muted">{roleLabel}</p>
        </div>
        <ThemeToggle />
      </div>
      {/* Nav */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-11 items-center gap-3 rounded-control px-3 text-label font-medium transition-colors duration-150",
                    active
                      ? "bg-accent text-accent-contrast font-semibold"
                      : "text-ink hover:bg-panel",
                  ].join(" ")}
                >
                  <span aria-hidden="true" className="shrink-0">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* User profile / sign out */}
      <div className="border-t border-border-card px-4 py-4">
        <p className="mb-2 truncate text-fine font-semibold text-ink" title={userName}>{userName}</p>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Student-specific app shell.
 *
 *  Desktop (≥ 1024px): Fixed left sidebar, identical to Coordinator/Admin.
 *  Mobile (< 1024px):
 *   - Header with logo, text-size toggle, hamburger (secondary nav).
 *   - Fixed bottom tab bar with the first 4 nav items (44px touch targets).
 *   - Main content has pb-20 to prevent bottom-bar occlusion.
 */
export function StudentShell({
  productName = "College Events",
  roleLabel,
  userName,
  navItems,
  signOut,
  children,
}: {
  productName?: string;
  roleLabel: string;
  userName: string;
  navItems: NavItem[];
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Primary tabs for bottom bar (max 4)
  const tabItems = navItems.slice(0, 4);

  useEffect(() => {
    if (!drawerOpen) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) openRef.current?.focus();
  }, [drawerOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border-card lg:bg-surface">
        <Sidebar
          productName={productName}
          roleLabel={roleLabel}
          userName={userName}
          navItems={navItems}
          signOut={signOut}
          pathname={pathname}
        />
      </div>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-border-card bg-surface px-4 lg:hidden">
        <p className="text-label font-bold text-ink">{productName}</p>
        <div className="flex items-center gap-2">
          <TextSizeControl />
          <ThemeToggle />
          <button
            ref={openRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="student-nav"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-panel"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Sheet drawer (full nav) */}
      {drawerOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id="student-nav"
            role="dialog"
            aria-label="Navigation menu"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border-card bg-surface shadow-xl transition-transform duration-200 lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-border-card px-4 py-3">
              <div className="flex items-center gap-2">
                <TextSizeControl />
                <ThemeToggle />
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-panel"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                productName={productName}
                roleLabel={roleLabel}
                userName={userName}
                navItems={navItems}
                signOut={signOut}
                pathname={pathname}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Quick navigation"
        className="fixed bottom-0 left-0 right-0 z-20 flex h-16 border-t border-border-card bg-surface lg:hidden"
      >
        {tabItems.map((item) => (
          <BottomTab key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Main content */}
      <main
        id="main"
        tabIndex={-1}
        className="min-h-screen pb-20 lg:pl-60 lg:pb-0"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
