"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { X, Menu } from "lucide-react";
import { Button } from "./button";
import { TextSizeControl } from "./text-size-control";
import { ThemeToggle } from "./theme-toggle";

export type NavItem = { href: string; label: string; icon: ReactNode };

/** Determines whether a nav item is active given current pathname.
 *  Role-home links (exact role roots) require exact match.
 *  Nested section links allow prefix matching. */
export function isNavActive(pathname: string, href: string): boolean {
  const roleRoots = ["/coordinator", "/admin", "/student"];
  if (roleRoots.includes(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
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
    <div className="flex h-full flex-col gap-0">
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

export function AppShell({
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

  // Trap focus + close on Escape when drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Return focus to hamburger on close
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
            aria-controls="mobile-nav"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-panel"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Sheet drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Slide-out panel */}
          <div
            id="mobile-nav"
            role="dialog"
            aria-label="Navigation menu"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border-card bg-surface shadow-xl transition-transform duration-200 lg:hidden"
          >
            {/* Drawer header */}
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
            {/* Drawer nav */}
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

      {/* Main content — offset for desktop sidebar */}
      <main
        id="main"
        tabIndex={-1}
        className="min-h-screen lg:pl-60"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
