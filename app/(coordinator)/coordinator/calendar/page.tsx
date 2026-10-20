import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listEventsWithSeats } from "@/lib/domain/views";
import { Calendar } from "../_components/calendar";
import { currentMonth, validMonth } from "../_lib/calendar";

export const metadata: Metadata = { title: "Calendar - College Events" };

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string; view?: string }> }) {
  const p = await requireRole("coordinator");
  const sp = await searchParams;
  const now = new Date();
  const month = validMonth(sp.month) ? sp.month : currentMonth(now);
  const events = await listEventsWithSeats({ id: p.id, role: p.role });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">Calendar</h1>
      <Calendar events={events} month={month} view={sp.view === "month" ? "month" : "agenda"} now={now} />
    </div>
  );
}
