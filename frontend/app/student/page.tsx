"use client";

import { ArrowRight, CalendarX2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { EventCard } from "@/components/student/event-card";
import { StudentHead } from "@/components/shell/student-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { fmtDay, fmtTime, relative } from "@/lib/format";
import { useMe } from "@/lib/session";
import type { EventItem, RegistrationItem } from "@/lib/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Discover() {
  const { me } = useMe();
  const { data: events, error, mutate } = useSWR<EventItem[]>("/api/events");
  const { data: mine } = useSWR<RegistrationItem[]>("/api/registrations/mine");
  const { data: profile } = useSWR<{ department: string | null }>("/api/people/me");

  const [q, setQ] = useState("");
  const [week, setWeek] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [deptOff, setDeptOff] = useState(false); // department is pre-filled from the profile; one tap clears it
  const dept = deptOff ? null : profile?.department ?? null;

  const open = useMemo(
    () => (events ?? []).filter((e) => ["open", "ongoing"].includes(e.status)).sort((a, b) => +new Date(a.starts_at ?? 0) - +new Date(b.starts_at ?? 0)),
    [events],
  );
  const types = useMemo(() => [...new Set(open.map((e) => e.type).filter(Boolean) as string[])], [open]);
  const shown = open.filter((e) => {
    if (dept && e.department && e.department !== dept) return false; // events with no department are for everyone
    if (type && e.type !== type) return false;
    if (week && (!e.starts_at || +new Date(e.starts_at) > now + 7 * 864e5)) return false;
    if (q && !`${e.title} ${e.venue_name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const filtered = !!(dept || type || week || q);
  const clear = () => { setQ(""); setWeek(false); setType(null); setDeptOff(true); };

  const next = (mine ?? [])
    .filter((r) => r.reg_status !== "cancelled" && r.starts_at && +new Date(r.starts_at) > now)
    .sort((a, b) => +new Date(a.starts_at!) - +new Date(b.starts_at!))[0];
  const ms = next?.starts_at ? Math.max(0, +new Date(next.starts_at) - now) : 0;
  const countdown = ms >= 864e5 ? { n: Math.floor(ms / 864e5), unit: Math.floor(ms / 864e5) === 1 ? "day" : "days" } : { n: Math.max(1, Math.floor(ms / 36e5)), unit: "hours" };

  const chip = (on: boolean) => cn("min-h-11 shrink-0 rounded-full px-4 text-sm font-bold border transition active:scale-95", on ? "border-purple bg-purple text-on-purple" : "border-line-strong bg-surface text-muted hover:text-ink hover:border-ink");

  return (
    <>
      <StudentHead title="Discover" sub="Events you can join" name={me?.name}>
        <div className="relative mt-4">
          <label htmlFor="q" className="sr-only">Search events</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-faint" aria-hidden />
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events or venues" className="min-h-12 w-full rounded-full bg-surface pl-11 pr-4 text-[15px] text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-white/80" />
        </div>
      </StudentHead>

      <div className="relative -mt-6 lg:mt-6 space-y-5 px-4 lg:px-8">
        <div className="-mx-4 flex gap-2 relative overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0 [scrollbar-width:none]" role="group" aria-label="Filters">
          {profile?.department ? <button aria-pressed={!!dept} onClick={() => setDeptOff((v) => !v)} className={chip(!!dept)}>{profile.department}</button> : null}
          <button aria-pressed={week} onClick={() => setWeek((v) => !v)} className={chip(week)}>Next 7 days</button>
          {types.map((t) => <button key={t} aria-pressed={type === t} onClick={() => setType(type === t ? null : t)} className={chip(type === t)}>{cap(t)}</button>)}
        </div>

        {next ? (
          <Link href={`/student/events/${next.event_id}`} className="group relative isolate block overflow-hidden rounded-[28px] hero-dark p-5 text-white transition active:scale-[.985] sm:p-7">
            <p className="display num text-[clamp(2.75rem,1.8rem+5vw,4.5rem)] text-ice"><span className="sr-only">Your next event starts in </span>{countdown.n} {countdown.unit} to go</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold tracking-[-0.015em]">{next.title}</p>
                <p className="mt-0.5 text-[15px] text-navy-ink">{fmtDay(next.starts_at)}, {fmtTime(next.starts_at)}{next.venue_name ? ` · ${next.venue_name}` : ""}</p>
                <span className="sr-only">Starts {relative(next.starts_at)}</span>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ice text-neutral-950 transition group-hover:translate-x-1"><ArrowRight className="size-5" aria-hidden /></span>
            </div>
          </Link>
        ) : null}

        {error ? (
          <ErrorState onRetry={() => mutate()} message="We could not load events. Check your connection and try again." />
        ) : !events ? (
          <ListSkeleton rows={3} h="h-44" />
        ) : shown.length === 0 ? (
          <EmptyState art="search" icon={CalendarX2} title="No events match" body="Clear a filter to see more." action={<Button variant="purple" onClick={clear}>Clear filters</Button>} />
        ) : (
          <>
            <p className="num text-sm font-semibold text-muted" role="status">{shown.length} {shown.length === 1 ? "event" : "events"}{filtered ? " match your filters" : ""}</p>
            <Stagger className="grid gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(21rem,1fr))]">
              {shown.map((e) => <Item key={e.id}><EventCard e={e} /></Item>)}
            </Stagger>
          </>
        )}
      </div>
    </>
  );
}
