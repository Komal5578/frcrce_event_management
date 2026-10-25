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
  const [deptOff, setDeptOff] = useState(false);
  const dept = deptOff ? null : profile?.department ?? null;

  const open = useMemo(
    () => (events ?? []).filter((e) => ["open", "ongoing"].includes(e.status)).sort((a, b) => +new Date(a.starts_at ?? 0) - +new Date(b.starts_at ?? 0)),
    [events],
  );
  const types = useMemo(() => [...new Set(open.map((e) => e.type).filter(Boolean) as string[])], [open]);
  const shown = open.filter((e) => {
    if (dept && e.department !== dept) return false;
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

  const chip = (on: boolean) =>
    cn(
      "min-h-10 shrink-0 rounded-lg px-3.5 text-xs font-bold uppercase tracking-wider font-grotesk border-[1.5px] transition active:scale-95 cursor-pointer",
      on
        ? "border-[#1E1A17] bg-[#EF4B35] text-white"
        : "border-[#1E1A17]/30 bg-white text-[#1E1A17] hover:border-[#1E1A17]"
    );

  return (
    <>
      <StudentHead title="Discover" sub="Pinned events you can join" name={me?.name}>
        <div className="relative mt-4">
          <label htmlFor="q" className="sr-only">Search events</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#1E1A17]/60" aria-hidden />
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events or venues..."
            className="min-h-11 w-full rounded-xl bg-white pl-10 pr-4 text-sm font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/50 border border-[#1E1A17]/30 focus:outline-none focus:ring-2 focus:ring-[#EF4B35]"
          />
        </div>
      </StudentHead>

      <div className="-mt-6 lg:mt-6 space-y-5 px-4 lg:px-8">
        {/* Filter chips */}
        <div className="-mx-4 flex gap-2 relative overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0 [scrollbar-width:none]" role="group" aria-label="Filters">
          {profile?.department ? (
            <button aria-pressed={!!dept} onClick={() => setDeptOff((v) => !v)} className={chip(!!dept)}>
              {profile.department}
            </button>
          ) : null}
          <button aria-pressed={week} onClick={() => setWeek((v) => !v)} className={chip(week)}>
            Next 7 days
          </button>
          {types.map((t) => (
            <button key={t} aria-pressed={type === t} onClick={() => setType(type === t ? null : t)} className={chip(type === t)}>
              {cap(t)}
            </button>
          ))}
        </div>

        {/* Next event countdown card */}
        {next ? (
          <Link
            href={`/student/events/${next.event_id}`}
            className="group flex items-center gap-5 rounded-xl border-[1.5px] border-[#1E1A17]/25 bg-white p-4 shadow-sm transition hover:border-[#1E1A17] active:scale-[.99] sm:p-5"
          >
            <div className="grid min-w-20 place-items-center rounded-lg bg-[#EF4B35] border border-[#1E1A17] px-3 py-3 text-center text-white shadow-[2px_2px_0px_#1E1A17]" aria-hidden>
              <span className="num font-grotesk text-[32px] font-black leading-none">{countdown.n}</span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">{countdown.unit}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-grotesk text-xs font-black uppercase tracking-wider text-[#EF4B35]">
                Your next event <span className="sr-only">starts {relative(next.starts_at)}</span>
              </p>
              <p className="mt-0.5 truncate font-grotesk text-lg font-black text-[#1E1A17]">{next.title}</p>
              <p className="text-xs font-semibold text-[#1E1A17]/75">
                {fmtDay(next.starts_at)}, {fmtTime(next.starts_at)}
                {next.venue_name ? ` · ${next.venue_name}` : ""}
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-[#1E1A17] transition group-hover:translate-x-1" aria-hidden />
          </Link>
        ) : null}

        {error ? (
          <ErrorState onRetry={() => mutate()} message="We could not load notices. Check your connection and try again." />
        ) : !events ? (
          <ListSkeleton rows={3} h="h-44" />
        ) : shown.length === 0 ? (
          <EmptyState
            title="No events match your filter"
            body="Clear a department or search filter to see more pinned notices."
            action={<Button variant="primary" onClick={clear}>Clear filters</Button>}
          />
        ) : (
          <>
            <p className="num text-xs font-bold uppercase tracking-wider text-[#1E1A17]/70" role="status">
              {shown.length} {shown.length === 1 ? "notice" : "notices"}{filtered ? " matching filters" : " pinned"}
            </p>
            <Stagger className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(21rem,1fr))]">
              {shown.map((e) => (
                <Item key={e.id}>
                  <EventCard e={e} />
                </Item>
              ))}
            </Stagger>
          </>
        )}
      </div>
    </>
  );
}
