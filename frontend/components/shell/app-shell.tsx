"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import useSWR from "swr";
import { cn } from "@/lib/cn";
import { fetcher } from "@/lib/api";
import { signOut } from "@/lib/session";
import { initials } from "@/lib/format";
import { TextSizeControl, ThemeToggle } from "@/components/ui/prefs";
import { PageIn } from "@/components/ui/motion";
import { useTitle } from "@/lib/use-title";
import { BRAND, BrandMark } from "./brand";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };

function Nav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-medium transition-colors",
              active ? "text-ink" : "text-muted hover:bg-ink/[.05] hover:text-ink",
            )}
          >
            {active ? <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[10px] border border-line bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
            <it.icon className="relative size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.9} aria-hidden />
            <span className="relative flex-1">{it.label}</span>
            {it.badge ? (
              <span className="relative num grid min-w-6 place-items-center rounded-full bg-ice px-1.5 text-xs font-bold text-neutral-950">
                {it.badge}<span className="sr-only"> need attention</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({ items, roleLabel, name, home, onNavigate }: { items: NavItem[]; roleLabel: string; name: string; home: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col border-r border-line bg-surface-2 px-3 py-4">
      <Link href={home} onClick={onNavigate} className="mb-6 flex items-center gap-2.5 rounded-xl px-1.5 py-1">
        <BrandMark />
        <span className="leading-tight">
          <span className="display block text-[25px]">{BRAND}</span>
          <span className="block text-[12.5px] font-medium text-muted">{roleLabel}<span className="sr-only"> home</span></span>
        </span>
      </Link>
      <Nav items={items} onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl border border-line bg-surface p-2.5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ice text-sm font-bold text-neutral-950" aria-hidden>{initials(name)}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
          </div>
        </div>
        <button onClick={signOut} className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium text-muted border border-line transition hover:bg-surface-2 hover:text-ink">
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Coordinator + Admin desktop shell: navy sidebar, light canvas (the mockup's layout). Below 1024px the sidebar becomes a drawer. */
export function AppShell({ items, roleLabel, name, home, notifHref, children }: { items: NavItem[]; roleLabel: string; name: string; home: string; notifHref: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { data: unread } = useSWR<{ count: number }>("/api/notifications/unread-count", fetcher, { refreshInterval: 30000 });
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17.5rem_1fr]">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 font-bold text-navy focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>
      <aside className="sticky top-0 hidden h-dvh lg:block"><Sidebar items={items} roleLabel={roleLabel} name={name} home={home} /></aside>

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5 backdrop-blur-xl lg:px-8">
          <button className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-line lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href={home} aria-label={`${BRAND} home`} className="grid min-h-11 min-w-11 place-items-center lg:hidden max-[359px]:hidden"><BrandMark className="size-8" /><span className="display hidden text-[22px] min-[480px]:inline">{BRAND}</span></Link>
          <div className="ml-auto flex items-center gap-2">
            <TextSizeControl />
            <ThemeToggle />
            <Link href={notifHref} aria-label={`Notifications${unread?.count ? `, ${unread.count} unread` : ""}`} className="relative grid min-h-11 min-w-11 place-items-center rounded-xl bg-surface-2 text-muted border border-line hover:text-ink">
              <Bell className="size-[18px]" aria-hidden />
              {unread?.count ? <span className="num absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-extrabold text-white">{unread.count}</span> : null}
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-8 lg:py-8">
          <PageIn k={path}>{children}</PageIn>
        </main>
      </div>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
              <button className="absolute right-3 top-4 z-10 grid min-h-11 min-w-11 place-items-center rounded-xl text-muted hover:bg-ink/[.06]" aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" aria-hidden /></button>
              <Sidebar items={items} roleLabel={roleLabel} name={name} home={home} onNavigate={() => setOpen(false)} />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PageHeader({ title, sub, actions, back }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  useTitle(title);
  return (
    <div className="mb-6">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,1.25rem+1vw,1.875rem)] font-semibold leading-tight tracking-[-0.025em] text-ink">{title}</h1>
          {sub ? <p className="mt-1 text-[15px] text-muted">{sub}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
