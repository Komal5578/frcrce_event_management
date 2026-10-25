"use client";

import { CalendarSearch, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { StudentHead } from "@/components/shell/student-shell";
import { Tag, statusToTagVariant } from "@/components/board/Tag";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Item, Stagger } from "@/components/ui/motion";
import { ListSkeleton } from "@/components/ui/skeleton";
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
      <StudentHead title="My Events" sub={data ? `${up.length} upcoming reservations` : "Loading…"}>
        <div className="mt-4 grid grid-cols-7 gap-1.5" role="list" aria-label="Next 7 days">
          {days.map((d, i) => {
            const evs = up.filter((r) => r.starts_at && sameDay(new Date(r.starts_at), d));
            const today = i === 0;
            return (
              <div
                key={i}
                role="listitem"
                aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${today ? ", today" : ""}${evs.length ? `, ${evs.length} event${evs.length > 1 ? "s" : ""}: ${evs.map((x) => x.title).join(", ")}` : ""}`}
                className={cn(
                  "flex min-w-0 flex-col items-center rounded-xl py-2 text-center border border-white/20 transition",
                  today ? "bg-[#EF4B35] text-white shadow-sm" : "bg-white/10 text-[#F4EFE3]"
                )}
              >
                <span className="text-[11px] font-bold uppercase opacity-80">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className="num font-grotesk text-lg font-black leading-tight">{d.getDate()}</span>
                <span className={cn("mt-0.5 size-1.5 rounded-full", evs.length ? (today ? "bg-white" : "bg-[#F2B93B]") : "bg-transparent")} aria-hidden />
              </div>
            );
          })}
        </div>
      </StudentHead>

      <div className="-mt-6 lg:mt-6 space-y-4 px-4 lg:px-8">
        {/* Subtabs */}
        <div className="flex gap-2" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "up"}
            onClick={() => setTab("up")}
            className={cn(
              "font-grotesk min-h-10 rounded-lg px-4 text-xs font-bold uppercase tracking-wider border-[1.5px] transition cursor-pointer",
              tab === "up" ? "bg-[#1E1A17] text-white border-[#1E1A17]" : "bg-white text-[#1E1A17] border-[#1E1A17]/30 hover:border-[#1E1A17]"
            )}
          >
            Upcoming ({up.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === "past"}
            onClick={() => setTab("past")}
            className={cn(
              "font-grotesk min-h-10 rounded-lg px-4 text-xs font-bold uppercase tracking-wider border-[1.5px] transition cursor-pointer",
              tab === "past" ? "bg-[#1E1A17] text-white border-[#1E1A17]" : "bg-white text-[#1E1A17] border-[#1E1A17]/30 hover:border-[#1E1A17]"
            )}
          >
            Past ({past.length})
          </button>
        </div>

        {error ? (
          <ErrorState onRetry={() => mutate()} message="We could not load your reservations." />
        ) : !data ? (
          <ListSkeleton rows={3} h="h-28" />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === "up" ? "No upcoming events pinned" : "No past events recorded"}
            body={tab === "up" ? "Find an interesting event on the noticeboard and grab a seat." : "Events you attended will stay logged here."}
            action={
              <Link href="/events" className="font-grotesk inline-flex min-h-10 items-center justify-center rounded-lg bg-[#EF4B35] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[2px_2px_0px_#1E1A17] border border-[#1E1A17]">
                Browse Noticeboard
              </Link>
            }
          />
        ) : (
          <Stagger className="space-y-3">
            {list.map((r) => {
              const wait = r.reg_status === "waitlisted";
              return (
                <Item key={r.event_id}>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-[1.5px] border-[#1E1A17]/25 bg-white p-4.5 shadow-sm transition hover:border-[#1E1A17]">
                    <div className="min-w-0 flex-1 basis-64">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag
                          variant={statusToTagVariant(regStatus(r.reg_status))}
                          label={wait && r.waitlist_pos ? `Waitlist #${r.waitlist_pos}` : r.reg_status}
                        />
                        <Tag
                          variant={r.event_status === "cancelled" ? "red" : "teal"}
                          label={r.event_status}
                          icon={false}
                        />
                      </div>
                      <Link href={`/student/events/${r.event_id}`} className="font-grotesk text-lg font-extrabold tracking-tight text-[#1E1A17] hover:text-[#EF4B35]">
                        {r.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs font-semibold text-[#1E1A17]/75">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-[#1E1A17]/50" />
                          {fmtDay(r.starts_at)}, {fmtRange(r.starts_at, r.ends_at)}
                        </span>
                        {r.venue_name ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-[#1E1A17]/50" />
                            {r.venue_name}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/events/${r.event_id}`}
                        className="font-grotesk rounded-lg border border-[#1E1A17]/30 bg-white px-3.5 py-2 text-xs font-bold text-[#1E1A17] hover:border-[#1E1A17]"
                      >
                        Details
                      </Link>
                      {tab === "up" && r.event_status !== "cancelled" ? (
                        <button
                          onClick={() => setTarget(r)}
                          className="font-grotesk rounded-lg border border-[#EF4B35]/30 bg-[#FDE9E6] px-3.5 py-2 text-xs font-bold text-[#EF4B35] hover:border-[#EF4B35]"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Item>
              );
            })}
          </Stagger>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        verb="cancel"
        destructive
        summary={<div className="font-bold text-[#1E1A17]">{target?.title}</div>}
        consequence="Your seat will be released and given to the next person on the waitlist."
        confirmLabel="Confirm Cancel"
        onConfirm={cancel}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
