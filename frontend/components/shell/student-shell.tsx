"use client";

import { motion } from "motion/react";
import { Bell, CalendarHeart, ChevronLeft, ClipboardCheck, Compass, LogOut, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import useSWR from "swr";
import { cn } from "@/lib/cn";
import { fetcher } from "@/lib/api";
import { signOut, useMe } from "@/lib/session";
import { initials } from "@/lib/format";
import { TextSizeControl, ThemeToggle } from "@/components/ui/prefs";
import { PageIn } from "@/components/ui/motion";
import { useTitle } from "@/lib/use-title";
import { BRAND, BrandMark } from "./brand";

type Tab = { href: string; label: string; icon: LucideIcon; badge?: number };

/** Student interface: calm and readable noticeboard dashboard */
export function StudentShell({ name, children }: { name: string; children: ReactNode }) {
  const path = usePathname();
  const { data: profile } = useSWR<{ is_organizer: boolean }>("/api/people/me", fetcher);
  const { data: unread } = useSWR<{ count: number }>("/api/notifications/unread-count", fetcher, { refreshInterval: 30000 });
  const tabs: Tab[] = [
    { href: "/student", label: "Discover", icon: Compass },
    { href: "/student/my", label: "My Events", icon: CalendarHeart },
    ...(profile?.is_organizer ? [{ href: "/student/tasks", label: "My Tasks", icon: ClipboardCheck }] : []),
    { href: "/student/notifications", label: "Notifications", icon: Bell, badge: unread?.count },
  ];
  const isActive = (h: string) => (h === "/student" ? path === "/student" || path.startsWith("/student/events") : path === h || path.startsWith(h + "/"));

  return (
    <div className="min-h-dvh bg-[#F4EFE3] lg:grid lg:grid-cols-[16.5rem_1fr]">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-[#F4EFE3] px-4 py-3 font-bold text-[#1E1A17] focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>

      {/* Desktop Sidebar: calm, readable dark ink panel */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-[#1E1A17] px-3.5 py-5 text-[#F4EFE3] lg:flex border-r border-[#1E1A17]">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-xl px-1.5 py-1">
          <BrandMark />
          <span className="leading-tight">
            <span className="block font-grotesk text-[17px] font-extrabold tracking-[-0.01em] text-[#F4EFE3]">FrCRCE Events</span>
            <span className="block text-xs font-semibold text-[#D9CBB3]">Student Portal</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {tabs.map((t) => {
            const a = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={a ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 font-grotesk text-[15px] font-bold transition-colors",
                  a ? "text-white" : "text-[#D9CBB3]/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {a ? <motion.span layoutId="side-active" className="absolute inset-0 rounded-xl bg-white/15 border border-white/20" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
                <t.icon className="relative size-5 shrink-0" aria-hidden />
                <span className="relative flex-1">{t.label}</span>
                {t.badge ? <span className="num relative grid min-w-6 place-items-center rounded-full bg-[#EF4B35] px-1.5 text-xs font-extrabold text-white">{t.badge}<span className="sr-only"> unread</span></span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-white/10 p-3 border border-white/15">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#D9CBB3] text-[#1E1A17] text-sm font-extrabold" aria-hidden>{initials(name)}</span>
            <div className="min-w-0">
              <p className="truncate font-grotesk text-sm font-bold text-[#F4EFE3]">{name}</p>
              <p className="text-xs text-[#D9CBB3]">Student</p>
            </div>
          </div>
          <button onClick={signOut} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-[#F4EFE3] border border-white/20 hover:bg-white/10">
            <LogOut className="size-4" aria-hidden />Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 bg-[#F4EFE3]">
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1180px] pb-28 focus:outline-none lg:pb-12">
          <PageIn k={path}>{children}</PageIn>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[#1E1A17]/25 bg-[#F4EFE3]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
          {tabs.map((t) => {
            const a = isActive(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={a ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl font-grotesk text-[11.5px] font-bold transition-colors",
                    a ? "text-[#EF4B35]" : "text-[#1E1A17]/70 hover:text-[#1E1A17]"
                  )}
                >
                  {a ? <motion.span layoutId="tab-pill" className="absolute inset-x-2 top-0 h-1 rounded-b-full bg-[#EF4B35]" transition={{ type: "spring", stiffness: 500, damping: 36 }} /> : null}
                  <span className="relative">
                    <t.icon className="size-[22px]" strokeWidth={a ? 2.4 : 2} aria-hidden />
                    {t.badge ? <span className="num absolute -right-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-[#EF4B35] px-1 text-[10px] font-extrabold text-white">{t.badge}<span className="sr-only"> unread</span></span> : null}
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Header band for student screens: ink black with cream accents */
export function StudentHead({ title, sub, name: given, back, children }: { title: string; sub?: ReactNode; name?: string; back?: string; children?: ReactNode }) {
  const router = useRouter();
  const { me } = useMe();
  const name = given ?? me?.name;
  useTitle(title);
  return (
    <header className="rounded-b-[2rem] bg-[#1E1A17] px-5 pb-10 pt-5 text-[#F4EFE3] border-b border-[#1E1A17] lg:mx-8 lg:mt-6 lg:rounded-[2rem] lg:px-8 lg:pb-12 lg:pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {back ? (
          <button onClick={() => (back === "back" ? router.back() : router.push(back))} className="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[#F4EFE3]/90 hover:bg-white/10">
            <ChevronLeft className="size-5" aria-hidden /> Back
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-[#D9CBB3] text-[#1E1A17] text-sm font-extrabold border border-white/30" aria-hidden>{name ? initials(name) : "·"}</span>
            {name ? <span className="whitespace-nowrap font-grotesk text-sm font-bold text-[#F4EFE3] max-[430px]:hidden">Hello, {name.split(" ")[0]}</span> : null}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <TextSizeControl onDark />
          <ThemeToggle onDark />
          <button onClick={signOut} aria-label="Sign out" className="grid min-h-11 lg:hidden min-w-11 place-items-center rounded-xl bg-white/10 text-white border border-white/25 hover:bg-white/20"><LogOut className="size-[18px]" aria-hidden /></button>
        </div>
      </div>
      <h1 className="mt-5 font-grotesk text-[clamp(1.5rem,1.2rem+1.2vw,1.75rem)] font-extrabold leading-[0.98] tracking-[-0.01em]">{title}</h1>
      {sub ? <p className="mt-1 text-[15px] text-[#D9CBB3]">{sub}</p> : null}
      {children}
    </header>
  );
}
