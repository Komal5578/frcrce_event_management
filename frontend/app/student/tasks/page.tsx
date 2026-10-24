"use client";

import { PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { StudentHead } from "@/components/shell/student-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDay, relative } from "@/lib/format";
import { taskStatus } from "@/lib/status";
import type { MyTaskItem } from "@/lib/types";

export default function MyTasks() {
  const router = useRouter();
  const { data: profile } = useSWR<{ is_organizer: boolean }>("/api/people/me");
  const { data, error, mutate } = useSWR<MyTaskItem[]>("/api/tasks/mine");
  const flash = useFlash();
  useEffect(() => { if (profile && !profile.is_organizer) router.replace("/student"); }, [profile, router]);

  async function set(t: MyTaskItem, label: "Done" | "To do") {
    mutate((l) => l?.map((x) => (x.id === t.id ? { ...x, status: label === "Done" ? "done" : "todo" } : x)), { revalidate: false });
    try {
      await api(`/api/tasks/${t.id}/status`, { method: "PATCH", json: { label } });
      if (label === "Done") flash("Marked done.", { undo: () => set(t, "To do") });
    } catch (e) { flash(errText(e), { kind: "err" }); }
    mutate();
  }

  const open = (data ?? []).filter((t) => t.status !== "done").sort((a, b) => +new Date(a.due_at ?? 9e15) - +new Date(b.due_at ?? 9e15));
  const done = (data ?? []).filter((t) => t.status === "done");

  return (
    <>
      <StudentHead title="My Tasks" sub="Organizer view only" />
      <div className="-mt-6 lg:mt-6 space-y-4 px-4 lg:px-8">
        {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <ListSkeleton rows={3} h="h-28" /> : data.length === 0 ? (
          <EmptyState art="tasks" icon={PartyPopper} title="No tasks assigned" body="When a coordinator assigns you something, it shows up here." />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="To do" value={open.length} tone="blue" />
              <StatTile label="Overdue" value={open.filter((t) => taskStatus(t) === "overdue").length} tone="red" />
              <StatTile label="Done" value={done.length} tone="green" />
            </div>
            <Stagger className="grid gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(21rem,1fr))]">
              {open.map((t) => {
                const s = taskStatus(t);
                return (
                  <Item key={t.id}>
                    <article className={cn("rounded-2xl bg-surface p-4 shadow-card border", s === "overdue" ? "border-[var(--st-overdue-fg)]/40" : "border-line")}>
                      <h2 className="text-[17px] font-extrabold tracking-tight">{t.title}</h2>
                      <p className="mt-0.5 text-sm text-muted">{t.event_title}</p>
                      <p className="mt-2 text-sm font-semibold text-muted">{t.due_at ? `Due ${fmtDay(t.due_at)} · ${relative(t.due_at)}` : "No due date"}</p>
                      <div className="mt-3 flex items-center justify-between gap-2"><StatusBadge status={s} /><Button size="sm" variant="purple" onClick={() => set(t, "Done")}>Mark done</Button></div>
                    </article>
                  </Item>
                );
              })}
            </Stagger>
            {open.length === 0 ? <EmptyState art="tasks" icon={PartyPopper} title="All caught up" body="Nothing left to do. Nice work." /> : null}
            {done.length ? (
              <section aria-labelledby="done-h" className="space-y-2.5 pt-2">
                <h2 id="done-h" className="px-1 text-sm font-bold text-muted">Done ({done.length})</h2>
                {done.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3.5 border border-line">
                    <div className="min-w-0"><p className="truncate font-bold text-muted line-through decoration-1">{t.title}</p><p className="truncate text-[13px] text-faint">{t.event_title}</p></div>
                    <Button size="sm" variant="ghost" onClick={() => set(t, "To do")}>Undo</Button>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
