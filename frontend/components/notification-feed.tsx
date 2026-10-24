"use client";

import { BellOff, CheckCheck, CircleAlert, Info, Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import { relative } from "@/lib/format";
import type { AlertItem, NotificationItem } from "@/lib/types";

const alertStatus = { clash: "clash", overdue: "overdue", low_registrations: "low", low: "low" } as const;

/** In-app notifications only (`adr-004-scope`). Alerts are a kind of notification, not the list name. */
export function NotificationFeed({ withAlerts, accent = "brand" }: { withAlerts?: boolean; accent?: "brand" | "purple" }) {
  const { data, error, mutate } = useSWR<NotificationItem[]>("/api/notifications");
  const { data: alerts } = useSWR<AlertItem[]>(withAlerts ? "/api/notifications/alerts" : null);
  const { mutate: global } = useSWRConfig();
  const flash = useFlash();
  const [shown, setShown] = useState(10);
  const unread = (data ?? []).filter((n) => !n.read_at);

  async function read(n: NotificationItem) {
    if (n.read_at) return;
    mutate((l) => l?.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)), { revalidate: false });
    try { await api(`/api/notifications/${n.id}/read`, { method: "POST" }); } catch (e) { flash(errText(e), { kind: "err" }); }
    mutate(); global("/api/notifications/unread-count");
  }
  async function readAll() {
    await Promise.all(unread.map((n) => api(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {})));
    flash("All notifications marked as read.");
    mutate(); global("/api/notifications/unread-count");
  }

  return (
    <div className="space-y-6">
      {alerts?.length ? (
        <section aria-labelledby="needs" className="space-y-2.5">
          <h2 id="needs" className="text-base font-extrabold">Needs attention</h2>
          <div className="grid gap-2.5 md:grid-cols-2">
          {alerts.map((a) => (
            <Link key={a.key} href={a.href} className="flex items-center gap-3 rounded-2xl bg-surface p-4 border border-line transition hover:ring-brand">
              <StatusBadge status={alertStatus[a.kind as keyof typeof alertStatus] ?? "low"} />
              <span className="flex-1 text-[15px]">{a.text}</span>
            </Link>
          ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all" className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="all" className="text-base font-extrabold">{withAlerts ? "Notifications" : "Latest"}</h2>
          {unread.length ? <Button size="sm" variant="ghost" onClick={readAll}><CheckCheck className="size-4" aria-hidden />Mark all read</Button> : null}
        </div>
        {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <ListSkeleton rows={4} h="h-20" /> : data.length === 0 ? (
          <EmptyState art="bell" icon={BellOff} title="Nothing new" body="Reminders and changes will show up here." />
        ) : (
          <Stagger className="space-y-2.5">
            {data.slice(0, shown).map((n) => {
              const Icon = n.kind === "registration" || n.kind === "waitlist" ? Ticket : n.kind === "alert" ? CircleAlert : Info;
              return (
                <Item key={n.id}>
                  <button onClick={() => read(n)} className={cn("flex w-full items-start gap-3.5 rounded-2xl p-4 text-left border transition active:scale-[.99]", n.read_at ? "border-line bg-surface" : accent === "purple" ? "border-transparent bg-purple-soft" : "border-transparent bg-brand-soft")}>
                    <Icon className={cn("mt-0.5 size-5 shrink-0", accent === "purple" ? "text-purple" : "text-brand")} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[15px] leading-snug", n.read_at ? "text-muted" : "font-semibold text-ink")}>{n.body}</span>
                      <span className="mt-1 block text-[13px] text-faint">{relative(n.created_at)}{!n.read_at ? <span className="ml-2 font-bold text-ink">· New</span> : null}</span>
                    </span>
                  </button>
                </Item>
              );
            })}
          </Stagger>
        )}
        {data && data.length > shown ? <Button variant="secondary" full onClick={() => setShown((n) => n + 10)}>Show 10 more ({data.length - shown} older)</Button> : null}
      </section>
    </div>
  );
}
