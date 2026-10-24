"use client";

import { CalendarSearch, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { StudentHead } from "@/components/shell/student-shell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDay, fmtRange, sameDay } from "@/lib/format";
import { regStatus } from "@/lib/status";
import type { RegistrationItem } from "@/lib/types";

export default function MyEvents() {
  const { data, error, mutate } = useSWR<RegistrationItem[]>("/api/registrations/mine");
  const flash = useFlash();
  const [tab, setTab] = useState<"up" | "past">("up");
  const [target, setTarget] = useState<RegistrationItem | null>(null);

  const regs = useMemo(() => (data ?? []).filter((r) => r.reg_status !== "cancelled"), [data]);
  const now = new Date();
  const isPast = (r: RegistrationItem) => r.event_status === "completed" || (r.ends_at ? new Date(r.ends_at) < now : false);
  const up = regs.filter((r) => !isPast(r) && r.event_status !== "cancelled").sort((a, b) => +new Date(a.starts_at ?? 0) - +new Date(b.starts_at ?? 0));
  const past = regs.filter(isPast).sort((a, b) => +new Date(b.starts_at ?? 0) - +new Date(a.starts_at ?? 0));
  const list = tab === "up" ? up : past;

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });

  async function cancel() {
    if (!target) return;
    try {
      await api(`/api/events/${target.event_id}/register`, { method: "DELETE" });
      flash(`Registration cancelled for ${target.title}.`);
    } catch (e) { flash(errText(e), { kind: "err" }); }
    setTarget(null);
    mutate();
  }

  return (
    <>
      <StudentHead title="My Events" sub={data ? `${up.length} upcoming` : "Loading…"}>
        <div className="mt-4 grid grid-cols-7 gap-1.5" role="list" aria-label="Next 7 days">
          {days.map((d, i) => {
            const evs = up.filter((r) => r.starts_at && sameDay(new Date(r.starts_at), d));
            const today = i === 0;
            return (
              <div key={i} role="listitem" aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${today ? ", today" : ""}${evs.length ? `, ${evs.length} event${evs.length > 1 ? "s" : ""}: ${evs.map((x) => x.title).join(", ")}` : ""}`}
                className={cn("flex min-w-0 flex-col items-center rounded-2xl py-2 text-center", today ? "bg-ice text-neutral-950" : "border border-line bg-surface-2 text-ink")}>
                <span className="text-[11px] font-bold uppercase opacity-80">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className="num text-lg font-extrabold leading-tight">{d.getDate()}</span>
                <span className={cn("mt-0.5 size-1.5 rounded-full", evs.length ? (today ? "bg-purple" : "bg-gold") : "bg-transparent")} aria-hidden />
              </div>
            );
          })}
        </div>
      </StudentHead>

      <div className="relative -mt-6 lg:mt-6 space-y-4 px-4 lg:px-8">
        <div role="group" aria-label="Show upcoming or past events" className="grid grid-cols-2 rounded-2xl bg-surface p-1 shadow-card border border-line">
          {(["up", "past"] as const).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={cn("min-h-11 rounded-xl text-sm font-bold transition", tab === t ? "bg-purple text-on-purple" : "text-muted hover:text-ink")}>
              {t === "up" ? `Upcoming (${up.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <ListSkeleton rows={3} h="h-32" /> : list.length === 0 ? (
          <EmptyState art="calendar" icon={CalendarSearch} title={tab === "up" ? "Nothing booked yet" : "No past events"} body={tab === "up" ? "Find an event and register in a few taps." : "Events you attend will show up here."} action={tab === "up" ? <Link href="/student" className="inline-flex min-h-11 items-center rounded-xl bg-purple px-5 font-bold text-on-purple">Discover events</Link> : undefined} />
        ) : (
          <Stagger className="grid gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(21rem,1fr))]" key={tab}>
            {list.map((r) => (
              <Item key={r.event_id}>
                <article className="rounded-2xl bg-surface p-4 shadow-card border border-line">
                  <Link href={`/student/events/${r.event_id}`} className="block rounded-lg">
                    <h2 className="text-[17px] font-extrabold tracking-tight">{r.title}</h2>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted"><Clock className="size-3.5" aria-hidden />{fmtDay(r.starts_at)}, {fmtRange(r.starts_at, r.ends_at)}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-3.5" aria-hidden />{r.venue_name ?? "Venue to be set"}</p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {isPast(r) ? <StatusBadge status="completed" /> : <StatusBadge status={regStatus(r.reg_status)} label={r.reg_status === "waitlisted" && r.waitlist_pos ? `Waitlisted #${r.waitlist_pos}` : undefined} />}
                    {!isPast(r) ? <Button variant="secondary" size="sm" onClick={() => setTarget(r)}>Cancel</Button> : null}
                  </div>
                </article>
              </Item>
            ))}
          </Stagger>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        verb="cancel"
        destructive
        summary={target ? <div><p className="font-extrabold">{target.title}</p><p className="text-muted">{fmtDay(target.starts_at)}, {fmtRange(target.starts_at, target.ends_at)}</p></div> : null}
        consequence="Your seat will be released and the next person on the waitlist is offered it."
        confirmLabel="Confirm cancel"
        onConfirm={cancel}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
