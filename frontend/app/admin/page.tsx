"use client";

import { ArrowRight, CircleCheckBig, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { BarList } from "@/components/ui/meters";
import { ErrorState } from "@/components/ui/empty-state";
import { motion } from "motion/react";
import { CountUp, Item, Stagger } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag, statusToTagVariant } from "@/components/board/Tag";
import { dateBlock, fmtDay, fmtRange, plural } from "@/lib/format";
import { eventStatus, type StatusKey } from "@/lib/status";
import type { AlertItem, EventItem } from "@/lib/types";

const chartLoading = () => <Skeleton className="h-56 w-full" />;
const Trend = dynamic(() => import("@/components/ui/charts").then((m) => m.Trend), { ssr: false, loading: chartLoading });
const Donut = dynamic(() => import("@/components/ui/charts").then((m) => m.Donut), { ssr: false, loading: chartLoading });

const keyRows: [StatusKey, string][] = [
  ["draft", "The coordinator is still editing."],
  ["pending", "Waiting for your decision."],
  ["approved", "Approved, not yet open."],
  ["open", "Students can register."],
  ["full", "No seats left; a waitlist runs."],
  ["ongoing", "Happening now."],
  ["completed", "Finished; venue released."],
  ["cancelled", "Cancelled; registrants told."],
  ["returned", "Sent back with a reason."],
];

const alertKey = { clash: "clash", overdue: "overdue", low_registrations: "low" } as const;

export default function Dashboard() {
  const { data: events, error, mutate } = useSWR<EventItem[]>("/api/events");
  const { data: alerts } = useSWR<AlertItem[]>("/api/notifications/alerts");

  const m = useMemo(() => {
    const ev = events ?? [];
    const now = new Date();
    const inMonth = ev.filter((e) => e.starts_at && new Date(e.starts_at).getMonth() === now.getMonth() && new Date(e.starts_at).getFullYear() === now.getFullYear() && e.status !== "cancelled" && e.status !== "draft");
    const live = ev.filter((e) => ["open", "ongoing", "completed"].includes(e.status) && e.capacity);
    const seats = live.reduce((a, e) => a + (e.capacity ?? 0), 0);
    const reg = ev.reduce((a, e) => a + (e.confirmed ?? 0), 0);
    const dept = new Map<string, { n: number; reg: number; seats: number }>();
    ev.filter((e) => !["draft", "cancelled"].includes(e.status)).forEach((e) => { const k = e.department ?? "Other"; const d = dept.get(k) ?? { n: 0, reg: 0, seats: 0 }; dept.set(k, { n: d.n + 1, reg: d.reg + (e.confirmed ?? 0), seats: d.seats + (e.capacity ?? 0) }); });

    const group = (k: string) => (["pending", "returned"].includes(k) ? "Awaiting a decision" : ["approved", "open", "full", "ongoing"].includes(k) ? "Live or upcoming" : k === "cancelled" ? "Cancelled" : "Draft or finished");
    const status = new Map<string, number>();
    ev.forEach((e) => status.set(group(eventStatus(e)), (status.get(group(eventStatus(e))) ?? 0) + 1));
    const week = new Map<string, number>();
    ev.filter((e) => e.starts_at && !["draft", "cancelled"].includes(e.status)).forEach((e) => { const d = new Date(e.starts_at!); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = d.toISOString().slice(0, 10); week.set(k, (week.get(k) ?? 0) + 1); });
    return {
      pending: ev.filter((e) => e.status === "pending").sort((a, b) => +new Date(a.starts_at ?? 9e15) - +new Date(b.starts_at ?? 9e15)), open: ev.filter((e) => e.status === "open").length, inMonth: inMonth.length, reg,
      fill: seats ? Math.round((live.reduce((a, e) => a + (e.confirmed ?? 0), 0) / seats) * 100) : 0,
      dept: [...dept].map(([name, d]) => ({ name, value: d.n, note: `${plural(d.n, "event")} · ${d.reg} of ${d.seats} seats taken` })).sort((a, b) => b.value - a.value),
      status: [...status].map(([k, v]) => ({ k, v })),
      trend: [...week].sort().map(([k, value]) => ({ name: new Date(k).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value })),
    };
  }, [events]);

  const clashes = (alerts ?? []).filter((a) => a.kind === "clash").length;
  const colors: Record<string, string> = { "Awaiting a decision": "#F2B93B", "Live or upcoming": "#B5DDD4", "Cancelled": "#EF4B35", "Draft or finished": "#D9CBB3" };

  if (error) return <ErrorState onRetry={() => mutate()} message="We could not load the dashboard numbers. Your data is safe. Try again in a moment." />;

  return (
    <>
      <PageHeader
        title="Admin Overview"
        sub={events ? (m.pending.length ? `${plural(m.pending.length, "event")} waiting for your decision${clashes ? `, ${plural(clashes, "clash", "clashes")} to resolve first` : ""}.` : "Nothing needs your decision. New submissions will appear here.") : "Loading the latest numbers…"}
      />

      {events ? (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} aria-labelledby="decision" className="mb-5 grid overflow-hidden rounded-xl border-[1.5px] border-[#1E1A17] bg-[#1E1A17] text-[#F4EFE3] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="p-7 lg:p-8">
            <h2 id="decision" className="font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#D9CBB3]">{m.pending.length ? "Waiting for your decision" : "Your decision queue"}</h2>
            <p className="num mt-2 flex items-baseline gap-3 font-grotesk font-black leading-none">
              <span className="text-[64px] tracking-[-0.01em]"><CountUp value={m.pending.length} /></span>
              <span className="text-lg font-bold text-[#D9CBB3]">{m.pending.length === 1 ? "event" : "events"}</span>
            </p>
            <p className="mt-3 max-w-sm text-sm font-semibold text-[#D9CBB3]/85">{m.pending.length ? (clashes ? `${plural(clashes, "clash", "clashes")} to look at first. Approving is blocked while a slot is taken.` : "Each one shows its clash check before you approve.") : "New submissions will appear here."}</p>
            {m.pending.length ? (
              <Link href="/admin/approvals" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#EF4B35] px-4 font-grotesk text-xs uppercase font-bold text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] transition hover:bg-[#DB3D28]">
                Review {m.pending.length} <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : null}
          </div>
          {m.pending[0] ? (
            <Link href={`/admin/approvals/${m.pending[0].id}`} className="group flex flex-col justify-center gap-3 border-t border-white/15 bg-white/[.04] p-7 transition hover:bg-white/[.08] lg:border-l lg:border-t-0 lg:p-8">
              <span className="font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#D9CBB3]">Next in the queue</span>
              <span className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-content-center rounded-lg bg-[#D9CBB3] border border-[#1E1A17]/30 text-center text-[#1E1A17]" aria-hidden>
                  <span className="num font-grotesk text-xl font-black leading-none">{dateBlock(m.pending[0].starts_at).day}</span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase">{dateBlock(m.pending[0].starts_at).mon}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-grotesk text-lg font-extrabold text-[#F4EFE3]">{m.pending[0].title}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-[#D9CBB3]">{fmtDay(m.pending[0].starts_at)}, {fmtRange(m.pending[0].starts_at, m.pending[0].ends_at)}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#D9CBB3]"><MapPin className="size-3.5 text-[#EF4B35]" aria-hidden />{m.pending[0].venue_name} · {m.pending[0].coordinator_name}</span>
                </span>
              </span>
              <span className="flex items-center gap-1.5 font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#B5DDD4]">Open clash check <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          ) : null}
        </motion.section>
      ) : null}

      {!events ? <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div> : (
        <Stagger className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Item><StatTile label="Events this month" value={m.inMonth} tone="blue" /></Item>
          <Item><StatTile label="Open for registration" value={m.open} tone="amber" note="Students can register now" /></Item>
          <Item><StatTile label="Registrations" value={m.reg} tone="green" note="Confirmed seats, all events" /></Item>
          <Item><StatTile label="Average seat fill" value={m.fill} suffix="%" tone="slate" note="Open, ongoing and completed" /></Item>
        </Stagger>
      )}

      <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader title="Events per week" aside={<span className="text-xs font-bold text-[#1E1A17]/60">By start date</span>} />
          <div className="relative min-h-60 flex-1">{events ? <div className="absolute inset-0 p-4 pt-2"><Trend data={m.trend} height="100%" /></div> : <Skeleton className="m-4 h-56" />}</div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader title="Needs attention" aside={<Link href="/admin/notifications" className="font-grotesk text-xs font-bold uppercase text-[#EF4B35]">All</Link>} />
          <ul className="flex-1 space-y-2 p-2">
            {!alerts ? <li><Skeleton className="h-12" /></li> : alerts.length === 0 ? <li className="flex items-center gap-2 p-3 text-xs font-bold text-[#1B7F6B]"><CircleCheckBig className="size-4" aria-hidden />Nothing needs attention.</li> : alerts.slice(0, 3).map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="block rounded-lg bg-[#F4EFE3] p-3 border border-[#1E1A17]/20 transition hover:border-[#1E1A17]">
                  <StatusBadge status={alertKey[a.kind as keyof typeof alertKey] ?? "low"} />
                  <span className="mt-1.5 block text-xs font-semibold text-[#1E1A17]">{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader title="Events by department" />
          <div className="p-4">{events ? <BarList rows={m.dept} /> : <Skeleton className="h-40" />}</div>
        </Card>
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader title="Events by status" />
          <div className="flex-1 p-4">{events ? <Donut size={150} center={String(events.length)} sub="events" data={m.status.map((s) => ({ name: s.k, value: s.v, color: colors[s.k] ?? "#D9CBB3" }))} /> : <Skeleton className="h-40" />}</div>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Status key" aside={<span className="text-xs font-bold text-[#1E1A17]/60">Mustard = Pending, Teal = Approved, Red = Declined</span>} />
          <ul className="grid gap-x-8 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyRows.map(([s, meaning]) => (
              <li key={s} className="flex items-center gap-3">
                <Tag variant={statusToTagVariant(s)} label={s} className="w-28 justify-start" />
                <span className="text-xs font-medium text-[#1E1A17]/80">{meaning}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
