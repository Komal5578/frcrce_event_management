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
import { Item, Stagger } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateBlock, fmtDay, fmtRange, plural } from "@/lib/format";
import { eventStatus, type StatusKey } from "@/lib/status";
import type { AlertItem, EventItem } from "@/lib/types";

// Recharts is loaded on demand: keeps the dashboard's first load under the 300KB JS budget.
const chartLoading = () => <Skeleton className="h-56 w-full" />;
const Trend = dynamic(() => import("@/components/ui/charts").then((m) => m.Trend), { ssr: false, loading: chartLoading });
const Donut = dynamic(() => import("@/components/ui/charts").then((m) => m.Donut), { ssr: false, loading: chartLoading });

const keyRows: [StatusKey, string][] = [
  ["draft", "The coordinator is still editing."], ["pending", "Waiting for your decision."], ["approved", "Approved, not yet open."],
  ["open", "Students can register."], ["full", "No seats left; a waitlist runs."], ["ongoing", "Happening now."],
  ["completed", "Finished; venue released."], ["cancelled", "Cancelled; registrants told."], ["returned", "Sent back with a reason."],
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
    // Four groups only: one hue per meaning, not one per status.
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
  const colors: Record<string, string> = { "Awaiting a decision": "var(--chart-3)", "Live or upcoming": "var(--chart-1)", "Cancelled": "var(--chart-4)", "Draft or finished": "var(--line-strong)" };

  if (error) return <ErrorState onRetry={() => mutate()} message="We could not load the dashboard numbers. Your data is safe. Try again in a moment." />;
  return (
    <>
      <PageHeader
        title="Admin Overview"
        sub={events ? (m.pending.length ? `${plural(m.pending.length, "event")} waiting for your decision${clashes ? `, ${plural(clashes, "clash", "clashes")} to resolve first` : ""}.` : "Nothing needs your decision. New submissions will appear here.") : "Loading the latest numbers…"}
      />

      {events ? (
        <Card className="mb-5 overflow-hidden" aria-labelledby="decision">
          <CardHeader
            className="pb-3"
            title={<span id="decision">Waiting for your decision</span>}
            aside={m.pending.length ? <Link href="/admin/approvals" className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-hover active:scale-[.97]">Review {m.pending.length}<ArrowRight className="size-4" aria-hidden /></Link> : undefined}
          />
          {m.pending.length === 0 ? (
            <p className="flex items-center gap-2 border-t border-line px-5 py-5 text-[15px] font-medium text-good"><CircleCheckBig className="size-5" aria-hidden />Nothing needs your decision. New submissions will appear here.</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {m.pending.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/approvals/${e.id}`} className="group flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-2">
                    <span className="grid size-12 shrink-0 place-content-center rounded-[10px] border border-line bg-surface-2 text-center" aria-hidden>
                      <span className="num text-lg font-semibold leading-none text-ink">{dateBlock(e.starts_at).day}</span>
                      <span className="mt-0.5 text-[10.5px] font-semibold uppercase text-muted">{dateBlock(e.starts_at).mon}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{e.title}</span>
                      <span className="flex items-center gap-1.5 truncate text-[13.5px] text-muted"><MapPin className="size-3.5 shrink-0" aria-hidden />{e.venue_name} · {e.coordinator_name} · {fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {!events ? <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div> : (
        <Stagger className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Item><StatTile label="Events this month" value={m.inMonth} tone="blue" /></Item>
          <Item><StatTile label="Open for registration" value={m.open} tone="amber" note="Students can register now" /></Item>
          <Item><StatTile label="Registrations" value={m.reg} tone="green" note="Confirmed seats, all events" /></Item>
          <Item><StatTile label="Average seat fill" value={m.fill} suffix="%" tone="slate" note="Open, ongoing and completed" /></Item>
        </Stagger>
      )}

      <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader title="Events per week" aside={<span className="text-[13px] font-semibold text-muted">By start date</span>} />
          <div className="relative min-h-60 flex-1">{events ? <div className="absolute inset-0 p-4 pt-2"><Trend data={m.trend} height="100%" /></div> : <Skeleton className="m-4 h-56" />}</div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader title="Needs attention" aside={<Link href="/admin/notifications" className="flex min-h-11 min-w-11 items-center justify-center text-sm font-bold text-brand">All</Link>} />
          <ul className="flex-1 space-y-2 p-4">
            {!alerts ? <li><Skeleton className="h-12" /></li> : alerts.length === 0 ? <li className="flex items-center gap-2 p-3 font-semibold text-good"><CircleCheckBig className="size-5" aria-hidden />Nothing needs attention.</li> : alerts.slice(0, 3).map((a) => (
              <li key={a.key}><Link href={a.href} className="block rounded-2xl bg-surface-2 p-3 border border-line transition hover:ring-brand"><StatusBadge status={alertKey[a.kind as keyof typeof alertKey] ?? "low"} /><span className="mt-1.5 block text-[14px] leading-snug">{a.text}</span></Link></li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader title="Events by department" />
          <div className="p-5">{events ? <BarList rows={m.dept} /> : <Skeleton className="h-40" />}</div>
        </Card>
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader title="Events by status" />
          <div className="flex-1 p-5">{events ? <Donut size={150} center={String(events.length)} sub="events" data={m.status.map((s) => ({ name: s.k, value: s.v, color: colors[s.k] ?? "var(--line-strong)" }))} /> : <Skeleton className="h-40" />}</div>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Status key" aside={<span className="text-[13px] font-semibold text-muted">Same icon, word and colour on every screen</span>} />
          <ul className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {keyRows.map(([s, meaning]) => <li key={s} className="flex flex-col items-start gap-1.5"><StatusBadge status={s} /><span className="text-[14px] text-muted">{meaning}</span></li>)}
          </ul>
        </Card>
      </div>
    </>
  );
}
