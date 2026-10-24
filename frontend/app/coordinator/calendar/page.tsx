"use client";

import useSWR from "swr";
import { MonthCalendar } from "@/components/events/month-calendar";
import { PageHeader } from "@/components/shell/app-shell";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/session";
import type { EventItem } from "@/lib/types";

export default function CoordinatorCalendar() {
  const { me } = useMe();
  const { data, error, mutate } = useSWR<EventItem[]>("/api/events");
  const evs = (data ?? []).filter((e) => !["draft"].includes(e.status));
  return (
    <>
      <PageHeader title="Calendar" sub="See what is booked before you pick a slot." />
      {error ? <ErrorState onRetry={() => mutate()} /> : !data ? <Skeleton className="h-[34rem] w-full rounded-2xl" /> : (
        <MonthCalendar events={evs} href={(e) => (e.coordinator_id === me?.id ? `/coordinator/events/${e.id}` : "/coordinator/calendar")} />
      )}
    </>
  );
}
