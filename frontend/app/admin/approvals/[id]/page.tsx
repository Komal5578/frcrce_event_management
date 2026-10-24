"use client";

import { ArrowLeft, CheckCircle2, CornerUpLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { clashesFor, rivalsFor } from "@/lib/clash";
import { fmtDay, fmtRange, relative } from "@/lib/format";
import { eventStatus } from "@/lib/status";
import type { AllocationItem, BookingItem, EventItem } from "@/lib/types";

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const flash = useFlash();
  const { data: e, error, mutate } = useSWR<EventItem>(`/api/events/${id}`);
  const { data: alloc } = useSWR<AllocationItem[]>(`/api/events/${id}/allocations`);
  const win = e?.starts_at && e?.ends_at ? `from_time=${new Date(+new Date(e.starts_at) - 864e5).toISOString()}&to_time=${new Date(+new Date(e.ends_at) + 864e5).toISOString()}` : null;
  const { data: bookings } = useSWR<BookingItem[]>(win ? `/api/admin/bookings?${win}` : null);
  const [dlg, setDlg] = useState<"approve" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [rErr, setRErr] = useState("");

  if (error) return <ErrorState onRetry={() => mutate()} />;
  if (!e) return <div className="space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-72" /></div>;

  const clashes = bookings ? clashesFor({ ...e, event_id: e.id, venue_id: e.venue_id ?? null }, bookings) : null;
  const rivals = bookings ? rivalsFor({ ...e, event_id: e.id, venue_id: e.venue_id ?? null }, bookings) : [];
  const decided = e.status !== "pending";
  const tooSmall = !!(e.capacity && e.venue_capacity && e.capacity > e.venue_capacity);

  async function decide(action: "approve" | "return") {
    try {
      await api(`/api/events/${id}/review`, { method: "POST", json: { action, reason: action === "return" ? reason.trim() : null } });
      flash(action === "approve" ? "Approved. The coordinator has been notified." : "Returned with your reason. The coordinator has been notified.");
      router.push("/admin/approvals");
    } catch (x) { flash(errText(x), { kind: "err" }); setDlg(null); mutate(); }
  }
  const askReturn = () => { if (!reason.trim()) return setRErr("Add a short reason so the coordinator knows what to fix."); setRErr(""); setDlg("return"); };
  const summary = <div><p className="font-extrabold">{e.title}</p><p className="text-muted">{fmtDay(e.starts_at)}, {fmtRange(e.starts_at, e.ends_at)} · {e.venue_name}</p></div>;

  return (
    <>
      <PageHeader
        back={<Link href="/admin/approvals" className="mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden />Approvals</Link>}
        title={e.title}
        sub={<span className="flex flex-wrap items-center gap-3"><StatusBadge status={eventStatus(e)} /><span>by {e.coordinator_name} · {e.department}</span></span>}
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="What is being asked" />
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              {[["When", `${fmtDay(e.starts_at)}, ${fmtRange(e.starts_at, e.ends_at)}`], ["Where", `${e.venue_name ?? "No venue"}${e.venue_location ? `, ${e.venue_location}` : ""}`], ["Expected", `${e.capacity ?? "–"} people`], ["Venue seats", `${e.venue_capacity ?? "–"}`]].map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase tracking-wide text-faint">{k}</dt><dd className="mt-0.5 font-bold">{v}</dd></div>)}
              <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-faint">Resources</dt><dd className="mt-0.5 font-bold">{alloc ? (alloc.length ? alloc.map((a) => `${a.name} × ${a.quantity}`).join(", ") : "None requested") : "…"}</dd></div>
              {e.description ? <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-faint">About</dt><dd className="mt-0.5 text-muted">{e.description}</dd></div> : null}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Clash check" aside={<span className="text-xs font-semibold text-muted">Computed, nothing typed</span>} />
            <div className="p-5">
              {!clashes ? <Skeleton className="h-14" /> : clashes.length === 0 ? (
                <p className="flex items-center gap-2.5 rounded-xl bg-good-soft p-3.5 font-semibold text-good"><CheckCircle2 className="size-5" aria-hidden />No clash. {e.venue_name} is free for this slot.</p>
              ) : (
                <div role="alert" className="space-y-2">{clashes.map((c) => <div key={c.event_id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--st-clash-bg)] p-3.5 text-[var(--st-clash-fg)]"><StatusBadge status="clash" /><span className="font-semibold">{c.title}, same venue, {fmtRange(c.starts_at, c.ends_at)}</span></div>)}<p className="text-sm text-muted">Approve is blocked while this clash exists. Return the request so the coordinator can pick another time or venue.</p></div>
              )}
              {rivals.length ? (
                <div role="status" className="mt-3 space-y-2 rounded-xl bg-[var(--st-pending-bg)] p-3.5 text-[var(--st-pending-fg)]">
                  <p className="font-bold">Another request wants this slot</p>
                  {rivals.map((r) => <p key={r.event_id} className="flex flex-wrap items-center gap-2 text-sm"><Link href={`/admin/approvals/${r.event_id}`} data-inline className="font-semibold underline">{r.title}</Link>, {fmtRange(r.starts_at, r.ends_at)}, still pending</p>)}
                  <p className="text-sm">If you approve this one, that request will clash and you will need to return it.</p>
                </div>
              ) : null}
              {tooSmall ? <p className="mt-3 rounded-xl bg-[var(--st-full-bg)] p-3 text-sm font-semibold text-[var(--st-full-fg)]">Heads up: {e.capacity} expected but the venue seats {e.venue_capacity}.</p> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader title="Requested by" />
          <div className="p-5">
            <p className="text-lg font-extrabold">{e.coordinator_name}</p>
            <p className="text-[15px] text-muted">{e.department} · coordinator</p>
            <p className="num mt-3 text-sm text-muted">Last updated {relative(e.updated_at)}</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Your decision" />
          <div className="space-y-4 p-5">
            {decided ? <p className="rounded-xl bg-surface-2 p-3.5 font-semibold text-muted border border-line">This request is already {eventStatus(e).replace("_", " ")}.</p> : (
              <>
                <Field label="Reason, if returning" error={rErr} hint="Required only when you return it.">{(i, d) => <Textarea id={i} aria-describedby={d} value={reason} onChange={(x) => { setReason(x.target.value); setRErr(""); }} placeholder="What should the coordinator change?" />}</Field>
                <Button full size="lg" disabled={!!clashes?.length || !clashes} onClick={() => setDlg("approve")}><ShieldCheck className="size-5" aria-hidden />Approve</Button>
                <Button full variant="secondary" onClick={askReturn}><CornerUpLeft className="size-4" aria-hidden />Return with reason</Button>
              </>
            )}
          </div>
        </Card>
        </div>
      </div>

      <ConfirmDialog open={dlg === "approve"} verb="approve" title={`Approve ${e.title}?`} summary={summary} consequence="The venue is booked and the coordinator is told in-app." confirmLabel="Confirm approval" onConfirm={() => decide("approve")} onCancel={() => setDlg(null)} />
      <ConfirmDialog open={dlg === "return"} verb="return" title={`Return ${e.title}?`} destructive summary={<div>{summary}<p className="mt-2 text-muted">“{reason}”</p></div>} consequence="The coordinator sees your reason and can fix and resubmit." confirmLabel="Confirm return" onConfirm={() => decide("return")} onCancel={() => setDlg(null)} />
    </>
  );
}
