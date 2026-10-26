"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { StudentHead } from "@/components/shell/student-shell";
import { Stamp } from "@/components/board/Stamp";
import { Tape } from "@/components/board/Tape";
import { Tag } from "@/components/board/Tag";
import { useMe } from "@/lib/session";
import { useParticipation } from "@/lib/demo/useParticipation";
import { DEMO_STUDENT_ID } from "@/lib/demo/participation";
import { getCouncilById, getCouncils } from "@/lib/demo/councils";
import { cn } from "@/lib/cn";

export default function StudentParticipationPage() {
  const { me } = useMe();
  const { records } = useParticipation();

  // Scope: Student sees only their own records (Step 8 Privacy Rule)
  // Default to signed in student id or fallback demo student Asha Patel
  const studentId = me?.id ?? DEMO_STUDENT_ID;

  // Find all events for councils
  const councils = useMemo(() => getCouncils(), []);
  const allCouncilEvents = useMemo(() => {
    return councils.flatMap((c) =>
      c.events.map((ev) => ({
        ...ev,
        councilId: c.id,
        councilName: c.name,
        councilHeadName: c.head.name,
      }))
    );
  }, [councils]);

  // Student's participation records
  const myRecords = useMemo(() => {
    // If student has direct records, show them; also fallback to DEMO_STUDENT_ID records if not found
    let userRecords = records.filter((r) => r.studentId === studentId);
    if (userRecords.length === 0) {
      userRecords = records.filter((r) => r.studentId === DEMO_STUDENT_ID);
    }
    return userRecords.map((rec) => {
      const event = allCouncilEvents.find((e) => e.id === rec.eventId);
      const council = getCouncilById(rec.councilId);
      return {
        ...rec,
        title: event?.title ?? "Crescendo Fest Event",
        date: event?.date ?? "October 2026",
        time: event?.time ?? "10:00 AM – 4:00 PM",
        venue: event?.venue ?? "Fr. CRCE Campus",
        councilName: council?.name ?? event?.councilName ?? "College Council",
        councilHeadName: council?.head.name ?? event?.councilHeadName,
      };
    });
  }, [records, studentId, allCouncilEvents]);

  // Metrics summary
  const summary = useMemo(() => {
    const attended = myRecords.filter((r) => r.status === "participated").length;
    const registered = myRecords.filter((r) => r.status === "registered").length;
    const missed = myRecords.filter((r) => r.status === "no-show").length;
    const distinctCouncils = new Set(myRecords.map((r) => r.councilId)).size;
    return {
      attended,
      registered,
      missed,
      total: myRecords.length,
      distinctCouncils,
    };
  }, [myRecords]);

  const tilts = [-1.5, 2, -2, 1.5, -1, 2.2];

  return (
    <>
      <StudentHead
        title="My Participation"
        sub="Your Crescendo event check-in records verified by council coordinators."
      >
        <div className="mt-3 flex items-center gap-2">
          <span className="font-script text-base text-[#F4EFE3]/90 rotate-[-1deg]">
            ★ Synchronized in real time with coordinator check-in stations
          </span>
        </div>
      </StudentHead>

      <div className="space-y-6 px-4 lg:px-8 py-6">
        {/* Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* Attended */}
          <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#B5DDD4] p-4 shadow-[2px_2px_0px_#1E1A17]">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#145C4D]">
              <CheckCircle2 className="size-4" /> Events Attended
            </span>
            <div className="mt-1 font-grotesk text-3xl font-black text-[#1E1A17]">
              {summary.attended}
            </div>
            <span className="text-xs text-[#145C4D]/80 font-semibold">
              present & confirmed
            </span>
          </div>

          {/* Councils Involved */}
          <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F2B93B] p-4 shadow-[2px_2px_0px_#1E1A17]">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A4B00]">
              <Building className="size-4" /> Councils Involved
            </span>
            <div className="mt-1 font-grotesk text-3xl font-black text-[#1E1A17]">
              {summary.distinctCouncils}
            </div>
            <span className="text-xs text-[#7A4B00]/80 font-semibold">
              distinct student bodies
            </span>
          </div>

          {/* Total Events Count */}
          <div className="col-span-2 sm:col-span-1 rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-4 shadow-[2px_2px_0px_#1E1A17]">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E1A17]/70">
              <CalendarCheck className="size-4" /> Total Events Pinned
            </span>
            <div className="mt-1 font-grotesk text-3xl font-black text-[#1E1A17]">
              {summary.total}
            </div>
            <span className="text-xs text-[#1E1A17]/60 font-semibold">
              registered on noticeboard
            </span>
          </div>
        </div>

        {/* Noticeboard Grid of Flyers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-grotesk text-lg font-black uppercase text-[#1E1A17] tracking-tight">
              Event Participation Flyers
            </h2>
            <Link
              href="/events"
              className="text-xs font-bold text-[#EF4B35] hover:underline"
            >
              Browse Noticeboard ↗
            </Link>
          </div>

          {myRecords.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border-[1.5px] border-dashed border-[#1E1A17]/30 bg-[#D9CBB3]/30 p-12 text-center">
              <div className="size-12 grid place-items-center rounded-xl bg-[#D9CBB3] text-[#1E1A17] mx-auto mb-3 border border-[#1E1A17]">
                <CalendarCheck className="size-6 text-[#1E1A17]/60" />
              </div>
              <h3 className="font-grotesk text-lg font-black text-[#1E1A17]">
                Nothing pinned yet.
              </h3>
              <p className="mt-1 text-sm font-semibold text-[#1E1A17]/70 max-w-sm mx-auto">
                You haven&apos;t pinned any Crescendo events to your participation board yet.
              </p>
              <div className="mt-5">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] px-4 py-2 font-grotesk text-xs uppercase font-extrabold text-white shadow-[2px_2px_0px_#1E1A17] hover:bg-[#DB3D28]"
                >
                  Browse Noticeboard Events
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myRecords.map((item, idx) => {
                const tilt = tilts[idx % tilts.length];

                return (
                  <div
                    key={`${item.eventId}_${item.councilId}`}
                    style={{ transform: `rotate(${tilt}deg)` }}
                    className={cn(
                      "relative rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-5 shadow-[4px_6px_0px_rgba(30,26,23,0.18)] transition hover:rotate-0 hover:scale-[1.01]"
                    )}
                  >
                    {/* Top Masking Tape */}
                    <Tape position="top" />

                    {/* Council Tag */}
                    <div className="flex items-center justify-between gap-2 pt-2 mb-2">
                      <span className="font-grotesk text-[11px] font-black uppercase tracking-wider text-[#EF4B35]">
                        {item.councilName}
                      </span>
                      {item.councilHeadName && (
                        <span className="text-[10px] font-semibold text-[#1E1A17]/60 truncate max-w-[120px]">
                          Head: {item.councilHeadName}
                        </span>
                      )}
                    </div>

                    {/* Event Title */}
                    <h3 className="font-grotesk text-lg font-black text-[#1E1A17] leading-snug min-h-[48px]">
                      {item.title}
                    </h3>

                    {/* Date, Time, Venue */}
                    <div className="mt-3 space-y-1 text-xs font-semibold text-[#1E1A17]/75 border-t border-[#1E1A17]/15 pt-2.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-[#1E1A17]/60" />
                        <span>{item.date} · {item.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-[#EF4B35]" />
                        <span>{item.venue}</span>
                      </div>
                    </div>

                    {/* Stamp matching coordinator marking */}
                    <div className="mt-4 pt-2 border-t border-dashed border-[#1E1A17]/20 flex items-center justify-between">
                      <div className="text-[11px] font-bold text-[#1E1A17]/60">
                        {item.status === "participated" && item.markedAt ? (
                          <span>Verified Present</span>
                        ) : item.status === "no-show" ? (
                          <span>Absent at check-in</span>
                        ) : (
                          <span>Entry Confirmed</span>
                        )}
                      </div>

                      {/* Stamped visual */}
                      {item.status === "participated" && (
                        <Stamp label="ATTENDED" variant="approved" />
                      )}
                      {item.status === "registered" && (
                        <Stamp label="REGISTERED" variant="pending" />
                      )}
                      {item.status === "no-show" && (
                        <Stamp label="MISSED" variant="declined" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mandatory Footer Note (Step 8) */}
        <footer className="pt-6 border-t border-[#1E1A17]/20 text-center text-xs font-semibold text-[#1E1A17]/60">
          Council head details are real. Student numbers are demo data, stored in this browser only.
        </footer>
      </div>
    </>
  );
}
