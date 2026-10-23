"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { TextSizeControl } from "./text-size-control";

export type NavItem = { href: string; label: string; icon: ReactNode };

export function AppShell({ productName = "College Events", roleLabel, userName, navItems, signOut, children }: {
  productName?: string;
  roleLabel: string;
  userName: string;
  navItems: NavItem[];
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasNav = navItems.length > 0;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border-card bg-panel px-4 py-2 sm:px-6">
        <p className="text-heading font-semibold">{productName}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <TextSizeControl />
          <p className="text-label font-semibold">
            {roleLabel}: {userName}
          </p>
          <form action={signOut}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div className="lg:flex">
        {hasNav && (
          <div className="bg-panel px-4 py-2 sm:px-6 lg:w-60 lg:shrink-0 lg:border-r lg:border-border-card lg:px-0 lg:py-4">
            <Button
              variant="secondary"
              className="lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              Menu
            </Button>
            <nav id="main-nav" aria-label="Main" className={`${menuOpen ? "block" : "hidden"} mt-2 lg:mt-0 lg:block`}>
              <ul className="flex flex-col gap-2 lg:gap-1">
                {navItems.map((item) => {
                  const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        className={`flex min-h-11 items-center gap-2 border-l-4 px-4 text-label font-semibold ${
                          current ? "border-accent text-accent" : "border-transparent text-ink"
                        }`}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-288 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </>
  );
}
