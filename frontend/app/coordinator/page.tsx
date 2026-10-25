"use client";

import { CalendarPlus, Inbox, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { EventRow, isLow } from "@/components/events/event-row";
import { StageStrip } from "@/components/events/stage-strip";
import { PageHeader } from "@/components/shell/app-shell";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { cn } from "@/lib/cn";
import { useMe } from "@/lib/session";
import type { EventItem, TaskItem } from "@/lib/types";

type F = "all" | "mine" | "needs";

export default function MyEvents() {
  const { me } = useMe();
  const { data, error, mutate } = useSWR<EventItem[]>("/api/events");
  const { data: tasks } = useSWR<TaskItem[]>("/api/tasks/coordinator");
  const [f, setF] = useState<F>("mine");

  const overdueEvents = useMemo(() => new Set((tasks ?? []).filter((t) => t.status !== "done" && t.due_at && new Date(t.due_at) < new Date()).map((t) => t.event_id)), [tasks]);
  const mine = (data ?? []).filter((e) => e.coordinator_id === me?.id);
  const needs = (e: EventItem) => ["draft", "returned"].includes(e.status) || overdueEvents.has(e.id) || isLow(e);
  const list = (f === "all" ? data ?? [] : f === "mine" ? mine : mine.filter(needs)).slice().sort((a, b) => +new Date(a.starts_at ?? 9e15) - +new Date(b.starts_at ?? 9e15));

  const tab = (k: F, label: string, n: number) => (
    <button
      key={k}
      aria-pressed={f === k}
      onClick={() => setF(k)}
      className={cn(
        "min-h-10 rounded-lg px-4 text-xs font-bold uppercase tracking-wider font-grotesk border-[1.5px] transition cursor-pointer",
        f === k
          ? "border-[#1E1A17] bg-[#1E1A17] text-white"
          : "border-[#1E1A17]/30 bg-white text-[#1E1A17] hover:border-[#1E1A17]"
      )}
    >
      {label} <span className="num opacity-80">({n})</span>
    </button>
  );

  return (
    <>
      <PageHeader
        title="Faculty & Coordinator Dashboard"
        sub="Everything you are running, soonest first."
        actions={
          <Link
            href="/coordinator/new"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#EF4B35] px-4 font-grotesk text-xs uppercase font-extrabold tracking-wider text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] hover:bg-[#DB3D28]"
          >
            <Plus className="size-4" aria-hidden /> New event
          </Link>
        }
      />

      {data ? (
        <Stagger className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Item><StatTile label="My events" value={mine.length} tone="slate" /></Item>
          <Item><StatTile label="Pending approval" value={mine.filter((e) => e.status === "pending").length} tone="amber" /></Item>
          <Item><StatTile label="Open for registration" value={mine.filter((e) => e.status === "open").length} tone="green" /></Item>
          <Item><StatTile label="Need your attention" value={mine.filter(needs).length} tone="red" note="Drafts, returned, overdue" /></Item>
        </Stagger>
      ) : null}

      {data ? (
        <div className="mb-6 rounded-xl border-[1.5px] border-[#1E1A17]/20 bg-white p-4 shadow-sm">
          <StageStrip counts={Object.fromEntries(["draft", "pending", "approved", "open", "ongoing", "completed"].map((s) => [s, mine.filter((e) => e.status === s).length]))} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter events">
        {tab("mine", "Mine", mine.length)}
        {tab("needs", "Needs me", mine.filter(needs).length)}
        {tab("all", "All", data?.length ?? 0)}
      </div>

      {error ? (
        <ErrorState onRetry={() => mutate()} message="We could not load your events. Your work is safe. Check your connection and try again." />
      ) : !data ? (
        <ListSkeleton rows={4} h="h-24" />
      ) : list.length === 0 ? (
        <EmptyState
          title={f === "needs" ? "Nothing needs you right now" : "No events created yet"}
          body={f === "needs" ? "Drafts, returned events and overdue tasks will show up here." : "Plan a new event or start from a template."}
          action={
            <Link
              href="/coordinator/new"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#EF4B35] px-4 font-grotesk text-xs uppercase font-extrabold tracking-wider text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17]"
            >
              <Plus className="size-4" aria-hidden /> New event
            </Link>
          }
        />
      ) : (
        <Stagger className="space-y-3">
          {list.map((e) => {
            const edit = ["draft", "returned"].includes(e.status) && e.coordinator_id === me?.id;
            return (
              <Item key={e.id}>
                <EventRow
                  e={e}
                  href={edit ? `/coordinator/new?draft=${e.id}` : `/coordinator/events/${e.id}`}
                  action={
                    edit ? (
                      <Link
                        href={`/coordinator/new?draft=${e.id}`}
                        className="flex min-h-9 items-center rounded-lg bg-[#EF4B35] px-3 font-grotesk text-xs uppercase font-bold text-white border border-[#1E1A17] hover:bg-[#DB3D28]"
                      >
                        {e.status === "returned" ? "Fix & resubmit" : "Continue"}
                      </Link>
                    ) : undefined
                  }
                />
              </Item>
            );
          })}
        </Stagger>
      )}
    </>
  );
}
