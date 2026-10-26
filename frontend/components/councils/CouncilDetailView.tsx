"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  TrendingUp,
  Percent,
} from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { CouncilHeadCard } from "@/components/councils/CouncilHeadCard";
import { Tape } from "@/components/board/Tape";
import { getCouncilById } from "@/lib/demo/councils";
import { useParticipation } from "@/lib/demo/useParticipation";

interface CouncilDetailViewProps {
  councilSlug: string;
  baseHref: string; // "/admin/councils" or "/coordinator/councils"
}

export function CouncilDetailView({ councilSlug, baseHref }: CouncilDetailViewProps) {
  const council = useMemo(() => getCouncilById(councilSlug), [councilSlug]);
  const { records } = useParticipation();

  // Compute live council participation counts
  const liveStats = useMemo(() => {
    if (!council) return { registered: 0, participated: 0, rate: 0 };
    const eventIds = new Set(council.events.map((e) => e.id));
    const cRecords = records.filter(
      (r) => r.councilId === council.id || eventIds.has(r.eventId)
    );
    const registered = cRecords.filter((r) => r.status === "registered").length || council.registered;
    const participated = cRecords.filter((r) => r.status === "participated").length || council.participated;
    const rate = registered > 0 ? Math.round((participated / registered) * 100) : 0;
    return { registered, participated, rate: Math.min(100, rate) };
  }, [council, records]);

  if (!council) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 text-center">
        <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-8 shadow-[3px_4px_0px_#1E1A17]">
          <h2 className="font-grotesk text-xl font-black text-[#1E1A17]">Council Not Found</h2>
          <p className="mt-2 text-sm text-[#1E1A17]/70 font-semibold">
            We could not find a council matching &quot;{councilSlug}&quot;.
          </p>
          <div className="mt-5">
            <Link
              href={baseHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[#EF4B35] px-4 py-2 font-grotesk text-xs uppercase font-extrabold text-white"
            >
              <ArrowLeft className="size-4" /> Back to Councils
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-2">
        <Link
          href={baseHref}
          className="inline-flex items-center gap-1.5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#1E1A17]/70 hover:text-[#EF4B35] transition"
        >
          <ArrowLeft className="size-4" /> Back to all councils
        </Link>
      </div>

      <PageHeader
        title={council.name}
        sub={`${council.category} · Fr. Conceicao Rodrigues College of Engineering`}
      />

      {/* Main Grid: Larger Head Card + Core Members + Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Larger Council Head Card & Core Members (Step 6) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-5 shadow-[3px_4px_0px_#1E1A17]">
            <Tape position="top" />
            <div className="text-xs font-grotesk font-extrabold uppercase text-[#1E1A17]/70 mb-3 pt-1">
              Council Public-Facing Head
            </div>
            {/* Head card larger size */}
            <CouncilHeadCard
              head={council.head}
              councilName={council.name}
              size="lg"
            />

            {/* Core Members Count Only (Step 6 requirement) */}
            <div className="mt-4 rounded-xl border border-[#1E1A17]/25 bg-white p-3.5 flex items-center justify-between">
              <div>
                <span className="block text-xs font-grotesk font-extrabold uppercase text-[#1E1A17]/70">
                  Core Committee
                </span>
                <span className="text-xs font-semibold text-[#1E1A17]/60">
                  Dedicated council members
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-grotesk text-xl font-black text-[#1E1A17]">
                <Users className="size-5 text-[#EF4B35]" />
                <span>{council.coreMembersCount}</span>
              </div>
            </div>
          </div>

          {/* About Noticeboard Card */}
          <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-5 shadow-[3px_4px_0px_#1E1A17]">
            <h3 className="font-grotesk text-sm font-black uppercase text-[#1E1A17] mb-2">
              Council Profile
            </h3>
            <p className="text-xs font-semibold text-[#1E1A17]/90 leading-relaxed">
              {council.description}
            </p>
          </div>
        </div>

        {/* Right Column: Participation Counts (Counts only - NO student names!) & Crescendo Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participation Metrics */}
          <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-white p-5 shadow-[3px_4px_0px_#1E1A17]">
            <h3 className="font-grotesk text-sm font-black uppercase text-[#1E1A17] mb-4">
              Student Participation Summary (Counts Only)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[#1E1A17]/20 bg-[#F4EFE3] p-3 text-center">
                <span className="block text-[11px] font-bold uppercase text-[#1E1A17]/70">Applied</span>
                <span className="num font-grotesk text-2xl font-black text-[#1E1A17]">{council.applied}</span>
                <span className="block text-[10px] text-[#1E1A17]/60 font-semibold mt-0.5">student interest</span>
              </div>
              <div className="rounded-xl border border-[#1E1A17]/20 bg-[#F2B93B]/20 p-3 text-center">
                <span className="block text-[11px] font-bold uppercase text-[#7A4B00]">Registered</span>
                <span className="num font-grotesk text-2xl font-black text-[#1E1A17]">{liveStats.registered}</span>
                <span className="block text-[10px] text-[#7A4B00] font-semibold mt-0.5">confirmed slots</span>
              </div>
              <div className="rounded-xl border border-[#1E1A17]/20 bg-[#B5DDD4]/30 p-3 text-center">
                <span className="block text-[11px] font-bold uppercase text-[#145C4D]">Participated</span>
                <span className="num font-grotesk text-2xl font-black text-[#1E1A17]">{liveStats.participated}</span>
                <span className="block text-[10px] text-[#145C4D] font-semibold mt-0.5">attended event</span>
              </div>
              <div className="rounded-xl border border-[#1E1A17]/20 bg-[#1E1A17] text-[#F4EFE3] p-3 text-center">
                <span className="block text-[11px] font-bold uppercase text-[#D9CBB3]">Turnout Rate</span>
                <span className="num font-grotesk text-2xl font-black text-[#F4EFE3]">{liveStats.rate}%</span>
                <span className="block text-[10px] text-[#D9CBB3]/80 font-semibold mt-0.5">attendance rate</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-[#1E1A17]/60 italic">
              * Privacy policy: Individual student names and roll numbers are visible only to the council&apos;s own coordinators.
            </div>
          </div>

          {/* Crescendo Fest Events */}
          <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-5 shadow-[3px_4px_0px_#1E1A17]">
            <h3 className="font-grotesk text-base font-black uppercase text-[#1E1A17] mb-3">
              Crescendo Festival Schedule ({council.events.length})
            </h3>

            {council.events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1E1A17]/30 p-6 text-center text-xs font-semibold text-[#1E1A17]/60">
                This council has no Crescendo festival events scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {council.events.map((ev) => {
                  const mapUrl = ev.mapFloorId && ev.mapEntityId
                    ? `/map?floor=${encodeURIComponent(ev.mapFloorId)}&entity=${encodeURIComponent(ev.mapEntityId)}`
                    : `/map?event=${encodeURIComponent(ev.id)}`;

                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl border-[1.5px] border-[#1E1A17] bg-white p-4 shadow-[1.5px_1.5px_0px_#1E1A17]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-grotesk text-base font-black text-[#1E1A17]">
                            {ev.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#1E1A17]/75">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3.5 text-[#1E1A17]/60" />
                              {ev.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5 text-[#1E1A17]/60" />
                              {ev.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 text-[#EF4B35]" />
                              {ev.venue}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Link
                            href={mapUrl}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E1A17] bg-[#B5DDD4] px-3 py-1.5 font-grotesk text-xs font-bold text-[#1E1A17] shadow-[1.5px_1.5px_0px_#1E1A17] hover:bg-[#9ecfc4] transition"
                          >
                            <MapPin className="size-3.5 text-[#EF4B35]" />
                            Locate on Map ↗
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Footer Note (Step 8) */}
      <footer className="pt-6 border-t border-[#1E1A17]/20 text-center text-xs font-semibold text-[#1E1A17]/60">
        Council head details are real. Student numbers are demo data, stored in this browser only.
      </footer>
    </div>
  );
}
