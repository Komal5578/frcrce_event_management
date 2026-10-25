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
              "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 font-grotesk text-[15px] font-bold transition-colors",
              active ? "text-white" : "text-[#D9CBB3] hover:bg-white/[.08] hover:text-white",
            )}
          >
            {active ? <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-white/15 border border-white/20" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
            {active ? <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#EF4B35]" aria-hidden /> : null}
            <it.icon className="relative size-5 shrink-0" strokeWidth={2} aria-hidden />
            <span className="relative flex-1">{it.label}</span>
            {it.badge ? (
              <span className="relative num grid min-w-6 place-items-center rounded-full bg-[#EF4B35] px-1.5 text-xs font-black text-white">
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
    <div className="flex h-full flex-col bg-[#1E1A17] px-3.5 py-5 text-[#F4EFE3] border-r border-[#1E1A17]">
      <Link href="/" onClick={onNavigate} className="mb-7 flex items-center gap-3 rounded-xl px-1.5 py-1">
        <BrandMark />
        <span className="leading-tight">
          <span className="block font-grotesk text-[17px] font-extrabold tracking-[-0.01em] text-[#F4EFE3]">FrCRCE Events</span>
          <span className="block text-xs font-semibold text-[#D9CBB3]">{roleLabel}<span className="sr-only"> home</span></span>
        </span>
      </Link>
      <Nav items={items} onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl bg-white/10 p-3 border border-white/15">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#D9CBB3] text-sm font-black text-[#1E1A17]" aria-hidden>{initials(name)}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-grotesk text-sm font-bold text-[#F4EFE3]">{name}</p>
            <p className="text-xs text-[#D9CBB3]">{roleLabel}</p>
          </div>
        </div>
        <button onClick={signOut} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-[#F4EFE3] border border-white/15 transition hover:bg-white/10">
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Coordinator + Admin desktop shell: calm and readable cream dashboard */
export function AppShell({ items, roleLabel, name, home, notifHref, children }: { items: NavItem[]; roleLabel: string; name: string; home: string; notifHref: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { data: unread } = useSWR<{ count: number }>("/api/notifications/unread-count", fetcher, { refreshInterval: 30000 });
  return (
    <div className="min-h-dvh bg-[#F4EFE3] lg:grid lg:grid-cols-[17.5rem_1fr]">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-[#F4EFE3] px-4 py-3 font-bold text-[#1E1A17] focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>
      <aside className="sticky top-0 hidden h-dvh lg:block"><Sidebar items={items} roleLabel={roleLabel} name={name} home={home} /></aside>

      <div className="min-w-0 bg-[#F4EFE3]">
        <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-[#1E1A17]/20 bg-[#F4EFE3]/90 px-4 py-2.5 backdrop-blur lg:px-8">
          <button className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#1E1A17]/30 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href="/" aria-label="FrCRCE Events home" className="grid min-h-11 min-w-11 place-items-center lg:hidden max-[359px]:hidden">
            <BrandMark className="size-8" />
            <span className="hidden font-grotesk font-extrabold tracking-tight min-[480px]:inline">FrCRCE Events</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <TextSizeControl />
            <ThemeToggle />
            <Link href={notifHref} aria-label={`Notifications${unread?.count ? `, ${unread.count} unread` : ""}`} className="relative grid min-h-11 min-w-11 place-items-center rounded-xl bg-white text-[#1E1A17] border border-[#1E1A17]/30 hover:border-[#1E1A17]">
              <Bell className="size-[18px]" aria-hidden />
              {unread?.count ? <span className="num absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#EF4B35] px-1 text-[11px] font-extrabold text-white">{unread.count}</span> : null}
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
              <button className="absolute right-3 top-4 z-10 grid min-h-11 min-w-11 place-items-center rounded-xl text-white hover:bg-white/10" aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" aria-hidden /></button>
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
          <h1 className="font-grotesk text-[clamp(1.5rem,1.2rem+1.2vw,1.75rem)] font-extrabold leading-[0.98] tracking-[-0.01em] text-[#1E1A17]">{title}</h1>
          {sub ? <p className="mt-1 text-[15px] font-semibold text-[#1E1A17]/75">{sub}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
