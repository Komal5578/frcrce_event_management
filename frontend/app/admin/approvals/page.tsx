"use client";

import { CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { EventRow } from "@/components/events/event-row";
import { PageHeader } from "@/components/shell/app-shell";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { clashesFor, rivalsFor } from "@/lib/clash";
import { fmtDay, relative } from "@/lib/format";
import { eventStatus } from "@/lib/status";
import type { BookingItem, EventItem } from "@/lib/types";

export default function Approvals() {
  const { data, error, mutate } = useSWR<EventItem[]>("/api/events");
  const [range] = useState(() => ({ from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), to: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) }));
  const { data: bookings } = useSWR<BookingItem[]>(`/api/admin/bookings?from_time=${range.from}T00:00:00Z&to_time=${range.to}T00:00:00Z`);
  const q = (data ?? []).filter((e) => e.status === "pending").sort((a, b) => +new Date(a.starts_at ?? 9e15) - +new Date(b.starts_at ?? 9e15));
  const recent = (data ?? []).filter((e) => ["approved", "returned", "open", "ongoing", "completed"].includes(e.status)).sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 5);
  return (
    <>
      <PageHeader title="Approvals" sub="Soonest first, so the most urgent decision is on top." />
      {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <ListSkeleton rows={3} h="h-24" /> : q.length === 0 ? (
        <EmptyState art="inbox" icon={CircleCheckBig} title="No events are waiting" body="You are all caught up. New submissions will appear here." />
      ) : (
        <Stagger className="space-y-3">
          {q.map((e) => {
            const b = { ...e, event_id: e.id, venue_id: e.venue_id ?? null };
            const c = bookings ? [...clashesFor(b, bookings), ...rivalsFor(b, bookings)] : [];
            return (
              <Item key={e.id}>
                <EventRow e={e} href={`/admin/approvals/${e.id}`} action={<div className="flex items-center gap-2">{c.length ? <StatusBadge status="clash" label="Clash: same slot" /> : null}<Link href={`/admin/approvals/${e.id}`} className="flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-hover">Open</Link></div>} />
              </Item>
            );
          })}
        </Stagger>
      )}

      {data ? (
        <section aria-labelledby="recent" className="mt-8">
          <h2 id="recent" className="mb-3 text-lg font-extrabold">Recently decided</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {recent.length === 0 ? <li className="p-5 text-muted">Nothing decided yet.</li> : recent.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5">
                <span className="min-w-0 flex-1 basis-56"><span className="block truncate font-bold">{e.title}</span><span className="text-sm text-muted">{e.coordinator_name} · {e.department} · {fmtDay(e.starts_at)}</span></span>
                <StatusBadge status={eventStatus(e)} />
                <span className="num w-28 text-right text-sm text-muted">{relative(e.updated_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
