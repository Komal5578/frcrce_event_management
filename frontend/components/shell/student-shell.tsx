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

/** Student interface: phone-first with a bottom tab bar; from lg up a purple sidebar and wide, multi-column content (responsive, not a phone frame). */
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
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 font-bold text-navy focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface-2 px-3 py-4 text-ink lg:flex">
        <Link href="/student" className="mb-6 flex items-center gap-2.5 rounded-xl px-1.5 py-1">
          <BrandMark /><span className="leading-tight"><span className="display block text-[25px]">{BRAND}</span><span className="block text-[12.5px] font-medium text-muted">Student<span className="sr-only"> home</span></span></span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {tabs.map((t) => {
            const a = isActive(t.href);
            return (
              <Link key={t.href} href={t.href} aria-current={a ? "page" : undefined} className={cn("relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-medium transition-colors", a ? "text-ink" : "text-muted hover:bg-ink/[.05] hover:text-ink")}>
                {a ? <motion.span layoutId="side-active" className="absolute inset-0 rounded-[10px] border border-line bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
                <t.icon className="relative size-5 shrink-0" aria-hidden /><span className="relative flex-1">{t.label}</span>
                {t.badge ? <span className="num relative grid min-w-6 place-items-center rounded-full bg-ice px-1.5 text-xs font-bold text-neutral-950">{t.badge}<span className="sr-only"> unread</span></span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-line bg-surface p-2.5">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-ice text-sm font-bold text-neutral-950" aria-hidden>{initials(name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-muted">Student</p></div></div>
          <button onClick={signOut} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted border border-line hover:bg-ink/[.05] hover:text-ink"><LogOut className="size-4" aria-hidden />Sign out</button>
        </div>
      </aside>

      <div className="min-w-0">
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1180px] pb-28 focus:outline-none lg:pb-12">
          <PageIn k={path}>{children}</PageIn>
        </main>
      </div>

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
          {tabs.map((t) => {
            const a = isActive(t.href);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={a ? "page" : undefined} className={cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11.5px] font-bold transition-colors", a ? "text-ink" : "text-muted hover:text-ink")}>
                  <span className="relative grid h-8 w-16 place-items-center">{a ? <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-ice" transition={{ type: "spring", stiffness: 500, damping: 36 }} /> : null}<t.icon className={cn("relative size-[22px]", a && "text-neutral-950")} strokeWidth={a ? 2.4 : 2} aria-hidden />{t.badge ? <span className="num absolute -right-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">{t.badge}<span className="sr-only"> unread</span></span> : null}</span>
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

/** Purple header band that overlaps the first card, as in the mockup's phone screens. */
export function StudentHead({ title, sub, name: given, back, children }: { title: string; sub?: ReactNode; name?: string; back?: string; children?: ReactNode }) {
  const router = useRouter();
  const { me } = useMe();
  const name = given ?? me?.name;
  useTitle(title);
  return (
    <header className="relative isolate overflow-hidden rounded-b-[2rem] hero-bg px-5 pb-12 pt-5 text-ink lg:mx-8 lg:mt-6 lg:rounded-[2rem] lg:px-8 lg:pb-14 lg:pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
        {back ? (
          <button onClick={() => (back === "back" ? router.back() : router.push(back))} className="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink hover:bg-ink/[.06]">
            <ChevronLeft className="size-5" aria-hidden /> Back
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-ice text-sm font-bold text-neutral-950" aria-hidden>{name ? initials(name) : "·"}</span>
            {name ? <span className="whitespace-nowrap text-sm font-semibold text-ink max-[430px]:hidden">Hello, {name.split(" ")[0]}</span> : null}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <TextSizeControl />
          <ThemeToggle />
          <button onClick={signOut} aria-label="Sign out" className="grid min-h-11 lg:hidden min-w-11 place-items-center rounded-xl border border-line bg-surface-2 text-ink hover:bg-surface"><LogOut className="size-[18px]" aria-hidden /></button>
        </div>
      </div>
      <h1 className="display mt-6 break-words text-[clamp(2.5rem,1.9rem+4vw,4.5rem)]">{title}</h1>
      {sub ? <p className="mt-2 text-[15px] text-muted">{sub}</p> : null}
      {children}
    </header>
  );
}
