"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Percent,
  Search,
  Filter,
  Download,
  Check,
  Undo2,
  AlertCircle,
  Building2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/shell/app-shell";
import { CouncilHeadCard } from "@/components/councils/CouncilHeadCard";
import { Tag } from "@/components/board/Tag";
import { Tape } from "@/components/board/Tape";
import { Stamp } from "@/components/board/Stamp";
import { useMe } from "@/lib/session";
import { findCouncilForDepartment, getCouncilById, getCouncils } from "@/lib/demo/councils";
import { useParticipation } from "@/lib/demo/useParticipation";
import type { Branch, ParticipationStatus } from "@/lib/demo/participation";
import { cn } from "@/lib/cn";

export default function CoordinatorAttendancePage() {
  const { me } = useMe();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCouncilSlug = searchParams.get("council");

  const {
    records,
    demoStudents,
    getStudentById,
    mark,
    markAll,
    getEventStats,
  } = useParticipation();

  // Find coordinator's council
  const myCouncil = useMemo(() => {
    if (!me?.name && !me?.email) return getCouncilById("student-council");
    if (me?.name?.toLowerCase().includes("student council") || me?.email?.startsWith("sc-")) {
      return getCouncilById("student-council");
    }
    // Match by name first, or by email slug
    const fromName = findCouncilForDepartment(me.name);
    if (fromName) return fromName;
    const emailPrefix = me.email?.split("@")[0] ?? "";
    const fromEmail = findCouncilForDepartment(emailPrefix);
    return fromEmail ?? getCouncilById("student-council");
  }, [me]);

  // Check if coordinator is attempting to view another council's data (Step 4 Privacy Scoping)
  const isUnauthorizedCouncil = useMemo(() => {
    if (!requestedCouncilSlug || !myCouncil) return false;
    const req = requestedCouncilSlug.toLowerCase().trim();
    if (myCouncil.id === "student-council" && (req.startsWith("sc-") || req === "student-council")) {
      return false;
    }
    return req !== myCouncil.id.toLowerCase() && req !== myCouncil.slug.toLowerCase();
  }, [requestedCouncilSlug, myCouncil]);

  // Active Council (strictly scoped to myCouncil)
  const council = myCouncil;

  // Selected event (default to all)
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Track recent animation on student row
  const [justMarkedId, setJustMarkedId] = useState<string | null>(null);

  // Events of this council
  const councilEvents = council?.events ?? [];

  // Filter records for this council
  const councilRecords = useMemo(() => {
    if (!council) return [];
    const isStuco = council.id === "student-council";
    const eventIds = new Set(councilEvents.map((e) => e.id));
    return records.filter((r) => {
      if (isStuco && (r.councilId.startsWith("sc-") || r.councilId === "student-council")) {
        return true;
      }
      return r.councilId === council.id || eventIds.has(r.eventId);
    });
  }, [council, councilEvents, records]);

  // Filter records by selected event
  const eventFilteredRecords = useMemo(() => {
    if (selectedEventId === "all") return councilRecords;
    return councilRecords.filter((r) => r.eventId === selectedEventId);
  }, [councilRecords, selectedEventId]);

  // Summary counts
  const stats = useMemo(() => {
    const total = eventFilteredRecords.length;
    const registered = eventFilteredRecords.filter((r) => r.status === "registered").length;
    const participated = eventFilteredRecords.filter((r) => r.status === "participated").length;
    const noShow = eventFilteredRecords.filter((r) => r.status === "no-show").length;
    const rate = total > 0 ? Math.round((participated / total) * 100) : 0;
    return { total, registered, participated, noShow, rate };
  }, [eventFilteredRecords]);

  // Search & filter student rows
  const displayRows = useMemo(() => {
    return eventFilteredRecords
      .map((rec) => {
        const student = getStudentById(rec.studentId);
        const event = councilEvents.find((e) => e.id === rec.eventId);
        return {
          ...rec,
          student,
          eventTitle: event?.title ?? "Crescendo Event",
        };
      })
      .filter((row) => {
        if (!row.student) return false;
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = row.student.name.toLowerCase().includes(q);
          const matchRoll = row.student.rollCode.toLowerCase().includes(q);
          if (!matchName && !matchRoll) return false;
        }
        // Branch
        if (branchFilter !== "all" && row.student.branch !== branchFilter) {
          return false;
        }
        // Status
        if (statusFilter !== "all" && row.status !== statusFilter) {
          return false;
        }
        return true;
      });
  }, [eventFilteredRecords, getStudentById, councilEvents, searchQuery, branchFilter, statusFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!council) return;
    const headers = ["Roll Code", "Student Name", "Branch", "Year", "Event Title", "Status", "Marked At"];
    const rows = displayRows.map((r) => [
      `"${r.student?.rollCode ?? ""}"`,
      `"${r.student?.name ?? ""}"`,
      `"${r.student?.branch ?? ""}"`,
      `"${r.student?.year ?? ""}"`,
      `"${r.eventTitle}"`,
      `"${r.status}"`,
      `"${r.markedAt ?? ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${council.slug}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mark single student with animation
  const handleMarkParticipated = (studentId: string, eventId: string) => {
    mark(studentId, eventId, "participated");
    setJustMarkedId(`${studentId}_${eventId}`);
    setTimeout(() => setJustMarkedId(null), 2500);
  };

  // Mark single student undo
  const handleUndo = (studentId: string, eventId: string) => {
    mark(studentId, eventId, "registered");
  };

  // Mark all registered as participated
  const handleMarkAll = () => {
    if (selectedEventId !== "all") {
      markAll(selectedEventId);
    } else {
      councilEvents.forEach((ev) => markAll(ev.id));
    }
  };

  // Unauthorized access warning banner
  if (isUnauthorizedCouncil) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4 text-center">
        <div className="relative rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-8 shadow-[4px_6px_0px_#1E1A17]">
          <Tape position="top" />
          <div className="mx-auto size-12 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="font-grotesk text-2xl font-black text-[#1E1A17]">
            Access Restricted: Scoped Council View
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#1E1A17]/80">
            You are signed in as coordinator for <strong className="text-[#1E1A17]">{council?.name}</strong>.
            A coordinator is strictly scoped to their own council and cannot view another council&apos;s student attendance.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.replace("/coordinator/attendance")}
              className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] px-5 py-2.5 font-grotesk text-sm font-bold text-white shadow-[2px_2px_0px_#1E1A17] hover:bg-[#DB3D28]"
            >
              Return to {council?.name} Attendance
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!council) {
    return (
      <div className="p-8 text-center font-grotesk text-base font-bold text-[#1E1A17]">
        Loading coordinator dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Scope Indicator */}
      <PageHeader
        title={`${council.name} Attendance`}
        sub="Check in students and mark Crescendo event participation in real time."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] px-3.5 py-2 font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] hover:bg-[#D9CBB3] transition"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={stats.registered === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#1B7F6B] px-3.5 py-2 font-grotesk text-xs uppercase font-extrabold tracking-wider text-white shadow-[2px_2px_0px_#1E1A17] hover:bg-[#156958] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Check className="size-3.5" />
              Mark All Registered as Participated
            </button>
          </div>
        }
      />

      {/* Top Section: Council Head Card + Stats Strip */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Council Head Card */}
        <div className="lg:col-span-1">
          <div className="text-xs font-grotesk font-extrabold uppercase text-[#1E1A17]/70 mb-1.5">
            Council Head & Leadership
          </div>
          <CouncilHeadCard
            head={council.head}
            councilName={council.name}
            showCoreMembers={council.coreMembersCount}
            size="md"
          />
        </div>

        {/* Summary Strip */}
        <div className="lg:col-span-2">
          <div className="text-xs font-grotesk font-extrabold uppercase text-[#1E1A17]/70 mb-1.5">
            Participation Metrics
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Registered */}
            <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#B87D00]">
                <Clock className="size-3" /> Registered
              </span>
              <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
                {stats.registered}
              </div>
              <span className="text-[10px] text-[#1E1A17]/60 font-semibold">
                awaiting check-in
              </span>
            </div>

            {/* Participated */}
            <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#B5DDD4] p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#145C4D]">
                <CheckCircle2 className="size-3" /> Participated
              </span>
              <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
                {stats.participated}
              </div>
              <span className="text-[10px] text-[#145C4D]/80 font-semibold">
                present & checked in
              </span>
            </div>

            {/* No-show */}
            <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#EF4B35]">
                <XCircle className="size-3" /> No-show
              </span>
              <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
                {stats.noShow}
              </div>
              <span className="text-[10px] text-[#1E1A17]/60 font-semibold">
                did not attend
              </span>
            </div>

            {/* Attendance Rate */}
            <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#1E1A17] p-3 text-[#F4EFE3] shadow-[1.5px_1.5px_0px_#1E1A17]">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#D9CBB3]">
                <Percent className="size-3" /> Rate
              </span>
              <div className="mt-1 font-grotesk text-2xl font-black text-[#F4EFE3]">
                {stats.rate}%
              </div>
              <span className="text-[10px] text-[#D9CBB3]/80 font-semibold">
                attendance rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Small Bar Chart (SVG): Registered vs Participated per Event */}
      {councilEvents.length > 0 && (
        <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-4 shadow-[2px_2px_0px_#1E1A17]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]">
              Attendance Distribution Per Event
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-bold text-[#1E1A17]/80">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#F2B93B] border border-[#1E1A17]/40" />
                Registered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#1B7F6B] border border-[#1E1A17]/40" />
                Participated
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {councilEvents.map((ev) => {
              const evRecords = records.filter((r) => r.eventId === ev.id);
              const total = evRecords.length || 1;
              const regCount = evRecords.filter((r) => r.status === "registered").length;
              const partCount = evRecords.filter((r) => r.status === "participated").length;
              const regPct = Math.round((regCount / total) * 100);
              const partPct = Math.round((partCount / total) * 100);

              return (
                <div key={ev.id} className="text-xs">
                  <div className="flex justify-between font-bold text-[#1E1A17] mb-1">
                    <span className="truncate max-w-[280px] sm:max-w-md">{ev.title}</span>
                    <span className="num font-grotesk text-[#1E1A17]/70">
                      {partCount} attended / {evRecords.length} registered
                    </span>
                  </div>
                  {/* SVG Bar */}
                  <div className="h-4 w-full bg-[#D9CBB3]/40 rounded-md overflow-hidden border border-[#1E1A17]/25 flex">
                    <div
                      style={{ width: `${partPct}%` }}
                      className="h-full bg-[#1B7F6B] transition-all duration-300"
                      title={`Participated: ${partCount} (${partPct}%)`}
                    />
                    <div
                      style={{ width: `${regPct}%` }}
                      className="h-full bg-[#F2B93B] transition-all duration-300"
                      title={`Registered: ${regCount} (${regPct}%)`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Noticeboard Panel: Filters + Student Table */}
      <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-4 sm:p-6 shadow-[3px_4px_0px_rgba(30,26,23,0.15)]">
        {/* Event Selector Strip */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 border-b border-[#1E1A17]/20 pb-3">
          <span className="text-xs font-grotesk font-extrabold uppercase text-[#1E1A17] mr-1">
            Event:
          </span>
          <button
            type="button"
            onClick={() => setSelectedEventId("all")}
            className={cn(
              "rounded-lg px-3 py-1 font-grotesk text-xs font-bold border transition cursor-pointer",
              selectedEventId === "all"
                ? "bg-[#1E1A17] text-[#F4EFE3] border-[#1E1A17]"
                : "bg-[#F4EFE3] text-[#1E1A17] border-[#1E1A17]/40 hover:bg-white"
            )}
          >
            All Events ({councilRecords.length})
          </button>
          {councilEvents.map((ev) => {
            const count = councilRecords.filter((r) => r.eventId === ev.id).length;
            const active = selectedEventId === ev.id;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEventId(ev.id)}
                className={cn(
                  "rounded-lg px-3 py-1 font-grotesk text-xs font-bold border transition cursor-pointer truncate max-w-[200px]",
                  active
                    ? "bg-[#1E1A17] text-[#F4EFE3] border-[#1E1A17]"
                    : "bg-[#F4EFE3] text-[#1E1A17] border-[#1E1A17]/40 hover:bg-white"
                )}
                title={ev.title}
              >
                {ev.title.replace("Crescendo: ", "")} ({count})
              </button>
            );
          })}
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#1E1A17]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or DEMO-0001..."
              className="w-full rounded-lg border border-[#1E1A17] bg-white py-2 pl-9 pr-3 text-xs font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/50 focus:outline-none focus:ring-2 focus:ring-[#EF4B35]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-lg border border-[#1E1A17] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1E1A17] focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches</option>
              <option value="Computer">Computer</option>
              <option value="IT">IT</option>
              <option value="EXTC">EXTC</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Chemical">Chemical</option>
              <option value="FE">FE</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#1E1A17] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1E1A17] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="participated">Participated</option>
              <option value="no-show">No-show</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto rounded-xl border border-[#1E1A17] bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1E1A17] bg-[#F4EFE3] font-grotesk text-[11px] font-black uppercase text-[#1E1A17]">
                <th scope="col" className="py-2.5 px-3">Roll Code</th>
                <th scope="col" className="py-2.5 px-3">Student Name</th>
                <th scope="col" className="py-2.5 px-3">Branch & Year</th>
                <th scope="col" className="py-2.5 px-3">Event</th>
                <th scope="col" className="py-2.5 px-3">Status</th>
                <th scope="col" className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1A17]/10 font-medium text-[#1E1A17]">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs font-bold text-[#1E1A17]/70">
                    No matching demo students found for this filter.
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => {
                  const key = `${row.studentId}_${row.eventId}`;
                  const isJustMarked = justMarkedId === key;

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "relative transition-colors",
                        isJustMarked ? "bg-[#B5DDD4]/30" : "hover:bg-[#F4EFE3]/50"
                      )}
                    >
                      {/* Roll Code */}
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1E1A17]/80">
                        {row.student?.rollCode}
                      </td>

                      {/* Student Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#1E1A17] flex items-center gap-1.5">
                          <span>{row.student?.name}</span>
                          {row.studentId === "a2000000-0000-0000-0000-000000000001" && (
                            <span className="rounded bg-[#F2B93B] px-1 py-0.2 text-[9px] font-black uppercase text-[#1E1A17]">
                              Demo Account
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Branch & Year */}
                      <td className="py-2.5 px-3 font-semibold text-[#1E1A17]/80">
                        {row.student?.branch} · {row.student?.year}
                      </td>

                      {/* Event Title */}
                      <td className="py-2.5 px-3 font-semibold text-[#1E1A17]/90 max-w-[200px] truncate" title={row.eventTitle}>
                        {row.eventTitle}
                      </td>

                      {/* Status Tag */}
                      <td className="py-2.5 px-3">
                        <div className="relative inline-block">
                          {row.status === "registered" && (
                            <Tag variant="mustard" label="Registered" />
                          )}
                          {row.status === "participated" && (
                            <Tag variant="teal" label="Participated" />
                          )}
                          {row.status === "no-show" && (
                            <Tag variant="red" label="No-show" />
                          )}

                          {/* Stamp Animation on mark */}
                          <AnimatePresence>
                            {isJustMarked && (
                              <motion.div
                                initial={{ scale: 2.2, opacity: 0, rotate: -15 }}
                                animate={{ scale: 1, opacity: 1, rotate: -4 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                className="absolute -top-3 -right-16 z-20 pointer-events-none"
                              >
                                <span className="inline-block px-2 py-0.5 rounded border-2 border-[#1B7F6B] bg-[#B5DDD4] font-grotesk text-[10px] font-black uppercase text-[#145C4D] shadow-md tracking-wider">
                                  PRESENT ✓
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        {row.status === "registered" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkParticipated(row.studentId, row.eventId)}
                            className="inline-flex items-center gap-1 rounded bg-[#1B7F6B] px-2.5 py-1 font-grotesk text-[11px] font-black uppercase text-white shadow-[1px_1px_0px_#1E1A17] hover:bg-[#156958] active:translate-x-[1px] active:translate-y-[1px] transition"
                          >
                            <Check className="size-3" />
                            Mark Participated
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUndo(row.studentId, row.eventId)}
                            className="inline-flex items-center gap-1 rounded border border-[#1E1A17]/40 bg-white px-2 py-1 font-grotesk text-[11px] font-bold text-[#1E1A17]/80 hover:bg-[#F4EFE3] hover:text-[#1E1A17] transition"
                            title="Undo back to registered"
                          >
                            <Undo2 className="size-3" />
                            Undo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Footer Note (Step 8) */}
      <footer className="pt-4 border-t border-[#1E1A17]/20 text-center text-xs font-semibold text-[#1E1A17]/60">
        Council head details are real. Student numbers are demo data, stored in this browser only.
      </footer>
    </div>
  );
}
