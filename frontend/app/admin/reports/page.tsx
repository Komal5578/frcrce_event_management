"use client";

import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { fmtStamp } from "@/lib/format";
import { STATUS_META, type StatusKey } from "@/lib/status";
import type { ReportData } from "@/lib/types";

type Row = { title: string; status: string; starts_at: string | null; venue: string | null; department: string | null; registered: number; capacity: number | null; overdue_tasks: number };
const keyOf = (label: string) => (Object.entries(STATUS_META).find(([, m]) => m.label === label)?.[0] ?? "draft") as StatusKey;

export default function Reports() {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const qs = new URLSearchParams({ ...(status ? { status } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  const { data, error, mutate } = useSWR<ReportData>(`/api/reports${qs ? `?${qs}` : ""}`);
  const rows = useMemo(() => (data?.rows ?? []) as Row[], [data]);
  const t = useMemo(() => ({ events: rows.length, reg: rows.reduce((a, r) => a + r.registered, 0), seats: rows.reduce((a, r) => a + (r.capacity ?? 0), 0) }), [rows]);

  return (
    <>
      <PageHeader title="Reports" sub="Computed from the live data. Nothing is typed." actions={<><a href={`/api/reports/export.csv${qs ? `?${qs}` : ""}`} download className="no-print inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4.5 font-semibold text-on-brand hover:bg-brand-hover active:scale-[.97]"><Download className="size-4" aria-hidden />Export CSV</a><Button variant="secondary" className="no-print" onClick={() => window.print()}><Printer className="size-4" aria-hidden />Print</Button></>} />

      <Card className="no-print mb-5 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">{(i) => <Select id={i} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["pending", "approved", "open", "ongoing", "completed", "cancelled", "returned"].map((s) => <option key={s} value={s}>{STATUS_META[s as StatusKey].label}</option>)}</Select>}</Field>
          <Field label="From">{(i) => <Input id={i} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
          <Field label="To">{(i) => <Input id={i} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
        </div>
      </Card>

      {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <Skeleton className="h-80 rounded-2xl" /> : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3.5">
            <StatTile label="Events listed" value={t.events} tone="blue" />
            <StatTile label="Registrations" value={t.reg} tone="green" />
            <StatTile label="Seat fill" value={t.seats ? Math.round((t.reg / t.seats) * 100) : 0} suffix="%" tone="slate" />
          </div>
          <div className="relative overflow-x-auto rounded-2xl bg-surface shadow-card border border-line">
            <table className="w-full min-w-[48rem] text-left text-[15px]">
              <caption className="sr-only">Events report, generated {fmtStamp(data.generatedAt)}</caption>
              <thead><tr className="border-b border-line text-sm text-muted"><th scope="col" className="px-4 py-3 font-semibold">Event</th><th scope="col" className="px-3 py-3 font-semibold">Dept</th><th scope="col" className="px-3 py-3 font-semibold">Date & time</th><th scope="col" className="px-3 py-3 text-right font-semibold">Registered</th><th scope="col" className="px-3 py-3 text-right font-semibold">Overdue tasks</th><th scope="col" className="px-4 py-3 font-semibold">Status</th></tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No events match these filters.</td></tr> : rows.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <th scope="row" className="px-4 py-3 font-bold">{r.title}<span className="block text-[13px] font-medium text-muted">{r.venue ?? "No venue"}</span></th>
                    <td className="px-3 py-3 text-muted">{r.department ?? "–"}</td>
                    <td className="num px-3 py-3 text-muted">{r.starts_at ? fmtStamp(r.starts_at) : "–"}</td>
                    <td className="num px-3 py-3 text-right font-semibold">{r.registered}{r.capacity ? <span className="font-normal text-muted"> / {r.capacity}</span> : null}</td>
                    <td className="num px-3 py-3 text-right">{r.overdue_tasks || <span className="text-faint">0</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={keyOf(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
