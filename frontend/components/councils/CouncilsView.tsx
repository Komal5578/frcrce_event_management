"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Filter,
  Users,
  Calendar,
  MapPin,
  Percent,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { CouncilHeadCard } from "@/components/councils/CouncilHeadCard";
import { Tape } from "@/components/board/Tape";
import { Tag } from "@/components/board/Tag";
import { getCouncils, type Council } from "@/lib/demo/councils";
import { useParticipation } from "@/lib/demo/useParticipation";
import { cn } from "@/lib/cn";

interface CouncilsViewProps {
  isAdmin?: boolean;
  baseHref: string; // e.g. "/admin/councils" or "/coordinator/councils"
}

export function CouncilsView({ isAdmin = false, baseHref }: CouncilsViewProps) {
  const councils = useMemo(() => getCouncils(), []);
  const { records, reset } = useParticipation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Compute live council participation counts from the client store
  const councilsWithLiveCounts = useMemo(() => {
    return councils.map((c) => {
      // Find participation records for this council's events
      const eventIds = new Set(c.events.map((e) => e.id));
      const cRecords = records.filter(
        (r) => r.councilId === c.id || eventIds.has(r.eventId)
      );

      const registered = cRecords.filter((r) => r.status === "registered").length || c.registered;
      const participated = cRecords.filter((r) => r.status === "participated").length || c.participated;
      const rate = registered > 0 ? Math.round((participated / registered) * 100) : 0;

      return {
        ...c,
        liveRegistered: registered,
        liveParticipated: participated,
        liveRate: Math.min(100, rate),
      };
    });
  }, [councils, records]);

  // Overall summary metrics across all councils
  const summary = useMemo(() => {
    const totalCouncils = councilsWithLiveCounts.length;
    const totalApplied = councilsWithLiveCounts.reduce((acc, c) => acc + c.applied, 0);
    const totalRegistered = councilsWithLiveCounts.reduce((acc, c) => acc + c.liveRegistered, 0);
    const totalParticipated = councilsWithLiveCounts.reduce((acc, c) => acc + c.liveParticipated, 0);
    const totalCrescendoEvents = councilsWithLiveCounts.reduce((acc, c) => acc + c.events.length, 0);
    const overallRate = totalRegistered > 0 ? Math.round((totalParticipated / totalRegistered) * 100) : 0;

    return {
      totalCouncils,
      totalApplied,
      totalRegistered,
      totalParticipated,
      totalCrescendoEvents,
      overallRate,
    };
  }, [councilsWithLiveCounts]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set(councils.map((c) => c.category));
    return ["all", ...Array.from(set)];
  }, [councils]);

  // Filtered councils
  const filteredCouncils = useMemo(() => {
    return councilsWithLiveCounts.filter((c) => {
      // Category filter
      if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchHead = c.head.name.toLowerCase().includes(q);
        const matchRole = c.head.role.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        if (!matchName && !matchHead && !matchRole && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [councilsWithLiveCounts, selectedCategory, searchQuery]);

  const handleReset = () => {
    reset();
    setResetMessage("Demo participation data reset successfully!");
    setTimeout(() => setResetMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={isAdmin ? "Councils & Leadership (Admin)" : "Councils & Leadership"}
        sub="Learn about each student body, verified council heads, and Crescendo festival participation."
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] px-3.5 py-2 font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] hover:bg-[#D9CBB3] transition cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Reset Demo Data
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Reset Confirmation Banner */}
      {resetMessage && (
        <div className="rounded-xl border border-[#1B7F6B] bg-[#B5DDD4]/40 p-3 text-xs font-bold text-[#145C4D] flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Councils */}
        <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1E1A17]/70">
            <Building2 className="size-3" /> Total Councils
          </span>
          <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
            {summary.totalCouncils}
          </div>
          <span className="text-[10px] text-[#1E1A17]/60 font-semibold">
            student bodies
          </span>
        </div>

        {/* Applied */}
        <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1E1A17]/70">
            <TrendingUp className="size-3" /> Total Applied
          </span>
          <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
            {summary.totalApplied}
          </div>
          <span className="text-[10px] text-[#1E1A17]/60 font-semibold">
            expressions of interest
          </span>
        </div>

        {/* Registered */}
        <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F2B93B] p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#7A4B00]">
            <Clock className="size-3" /> Registered
          </span>
          <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
            {summary.totalRegistered}
          </div>
          <span className="text-[10px] text-[#7A4B00]/80 font-semibold">
            confirmed event seats
          </span>
        </div>

        {/* Participated */}
        <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-[#B5DDD4] p-3 shadow-[1.5px_1.5px_0px_#1E1A17]">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#145C4D]">
            <CheckCircle2 className="size-3" /> Participated
          </span>
          <div className="mt-1 font-grotesk text-2xl font-black text-[#1E1A17]">
            {summary.totalParticipated}
          </div>
          <span className="text-[10px] text-[#145C4D]/80 font-semibold">
            attended & checked in
          </span>
        </div>

        {/* Crescendo Events */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border-[1.5px] border-[#1E1A17] bg-[#1E1A17] p-3 text-[#F4EFE3] shadow-[1.5px_1.5px_0px_#1E1A17]">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#D9CBB3]">
            <Calendar className="size-3" /> Fest Events
          </span>
          <div className="mt-1 font-grotesk text-2xl font-black text-[#F4EFE3]">
            {summary.totalCrescendoEvents}
          </div>
          <span className="text-[10px] text-[#D9CBB3]/80 font-semibold">
            Crescendo entries
          </span>
        </div>
      </div>

      {/* Admin Feature: Applied vs Registered Bar Chart (Step 6) */}
      {isAdmin && (
        <div className="rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-5 shadow-[2px_2px_0px_#1E1A17]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-grotesk text-sm uppercase font-extrabold tracking-wider text-[#1E1A17]">
                Applied vs Registered Interest by Council
              </h3>
              <p className="text-xs text-[#1E1A17]/70 font-semibold mt-0.5">
                Comparing total application interest against confirmed registered seats
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#1E1A17]">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-[#D9CBB3] border border-[#1E1A17]/40" />
                Applied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-[#F2B93B] border border-[#1E1A17]/40" />
                Registered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-[#1B7F6B] border border-[#1E1A17]/40" />
                Participated
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {councilsWithLiveCounts.slice(0, 9).map((c) => {
              const max = Math.max(c.applied, c.liveRegistered, 1);
              const appliedPct = Math.round((c.applied / max) * 100);
              const regPct = Math.round((c.liveRegistered / max) * 100);
              const partPct = Math.round((c.liveParticipated / max) * 100);

              return (
                <div key={c.id} className="rounded-lg border border-[#1E1A17]/20 p-3 bg-[#F4EFE3]/40">
                  <div className="flex justify-between items-center text-xs font-bold text-[#1E1A17] mb-1.5">
                    <span className="truncate max-w-[170px]">{c.name}</span>
                    <span className="text-[11px] text-[#1E1A17]/70 font-mono">
                      {c.liveParticipated}/{c.liveRegistered}
                    </span>
                  </div>
                  {/* SVG Multi-bar representation */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-10 text-[#1E1A17]/70 font-semibold">Apply</span>
                      <div className="h-2 flex-1 bg-white rounded border border-[#1E1A17]/20 overflow-hidden">
                        <div style={{ width: `${appliedPct}%` }} className="h-full bg-[#D9CBB3]" />
                      </div>
                      <span className="w-6 text-right font-mono">{c.applied}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-10 text-[#1E1A17]/70 font-semibold">Reg</span>
                      <div className="h-2 flex-1 bg-white rounded border border-[#1E1A17]/20 overflow-hidden">
                        <div style={{ width: `${regPct}%` }} className="h-full bg-[#F2B93B]" />
                      </div>
                      <span className="w-6 text-right font-mono">{c.liveRegistered}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-10 text-[#1E1A17]/70 font-semibold">Attnd</span>
                      <div className="h-2 flex-1 bg-white rounded border border-[#1E1A17]/20 overflow-hidden">
                        <div style={{ width: `${partPct}%` }} className="h-full bg-[#1B7F6B]" />
                      </div>
                      <span className="w-6 text-right font-mono">{c.liveParticipated}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-grotesk text-xs font-bold border transition cursor-pointer capitalize",
                selectedCategory === cat
                  ? "bg-[#1E1A17] text-[#F4EFE3] border-[#1E1A17]"
                  : "bg-white text-[#1E1A17] border-[#1E1A17]/30 hover:bg-[#F4EFE3]"
              )}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#1E1A17]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search council or leader..."
            className="w-full rounded-lg border border-[#1E1A17] bg-white py-1.5 pl-9 pr-3 text-xs font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/50 focus:outline-none focus:ring-2 focus:ring-[#EF4B35]"
          />
        </div>
      </div>

      {/* Councils Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredCouncils.map((c) => (
          <div
            key={c.id}
            className="relative flex flex-col justify-between rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-5 shadow-[3px_4px_0px_#1E1A17] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_5px_0px_#1E1A17]"
          >
            <div>
              {/* Category & Action */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-grotesk text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#1E1A17] text-[#F4EFE3]">
                  {c.category}
                </span>
                <Link
                  href={`${baseHref}/${c.slug}`}
                  className="inline-flex items-center gap-1 font-grotesk text-xs font-bold text-[#EF4B35] hover:underline"
                >
                  Detail View <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {/* Council Title */}
              <h3 className="font-grotesk text-xl font-black text-[#1E1A17] leading-tight mb-2">
                {c.name}
              </h3>

              {/* Description */}
              <p className="text-xs font-semibold text-[#1E1A17]/80 line-clamp-2 leading-relaxed mb-4">
                {c.description}
              </p>

              {/* Council Head Card */}
              <div className="mb-4">
                <CouncilHeadCard
                  head={c.head}
                  councilName={c.name}
                  size="sm"
                />
              </div>

              {/* Metrics Strip for Students (Counts only - NO student names!) */}
              <div className="rounded-xl border border-[#1E1A17]/20 bg-white p-2.5 mb-4 grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#1E1A17]/60">Applied</span>
                  <span className="num font-grotesk text-sm font-black text-[#1E1A17]">{c.applied}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#1E1A17]/60">Registered</span>
                  <span className="num font-grotesk text-sm font-black text-[#B87D00]">{c.liveRegistered}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#1E1A17]/60">Attended</span>
                  <span className="num font-grotesk text-sm font-black text-[#1B7F6B]">{c.liveParticipated}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#1E1A17]/60">Rate</span>
                  <span className="num font-grotesk text-sm font-black text-[#1E1A17]">{c.liveRate}%</span>
                </div>
              </div>
            </div>

            {/* Crescendo Events with Map Link */}
            <div>
              <div className="text-[11px] font-grotesk font-black uppercase text-[#1E1A17] mb-2 flex items-center justify-between border-t border-[#1E1A17]/15 pt-3">
                <span>Crescendo Events ({c.events.length})</span>
              </div>

              {c.events.length === 0 ? (
                <div className="text-xs text-[#1E1A17]/50 font-semibold italic">
                  No Crescendo events scheduled.
                </div>
              ) : (
                <div className="space-y-2">
                  {c.events.map((ev) => {
                    const mapUrl = ev.mapFloorId && ev.mapEntityId
                      ? `/map?floor=${encodeURIComponent(ev.mapFloorId)}&entity=${encodeURIComponent(ev.mapEntityId)}`
                      : `/map?event=${encodeURIComponent(ev.id)}`;

                    return (
                      <div
                        key={ev.id}
                        className="rounded-lg border border-[#1E1A17]/25 bg-white p-2.5 text-xs"
                      >
                        <div className="font-bold text-[#1E1A17] truncate">{ev.title}</div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-[#1E1A17]/70 font-semibold">
                          <span>{ev.date} · {ev.time}</span>
                          <Link
                            href={mapUrl}
                            className="inline-flex items-center gap-1 text-[#EF4B35] font-bold hover:underline"
                            title="Locate venue on Campus Map"
                          >
                            <MapPin className="size-3" />
                            <span>Campus Map ↗</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Footer Note (Step 8) */}
      <footer className="pt-6 border-t border-[#1E1A17]/20 text-center text-xs font-semibold text-[#1E1A17]/60">
        Council head details are real. Student numbers are demo data, stored in this browser only.
      </footer>
    </div>
  );
}
