"use client";

import { ExternalLink, Globe, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StudentHead } from "@/components/shell/student-shell";
import { PrimaryButton } from "@/components/board/PrimaryButton";

export default function MyEvents() {
  return (
    <>
      <StudentHead
        title="My Registrations & Tickets"
        sub="All college fest event registrations are managed on Unstop."
      >
        <div className="mt-3 flex items-center gap-2">
          <span className="font-script text-base text-[#F4EFE3]/90 rotate-[-1deg]">
            ★ Check your tickets & team entries on your Unstop account
          </span>
        </div>
      </StudentHead>

      <div className="space-y-6 px-4 lg:px-8 py-6">
        <div className="rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-6 sm:p-8 shadow-[4px_6px_0px_rgba(30,26,23,0.18)]">
          <div className="flex items-start gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] shrink-0">
              <Globe className="size-6" />
            </div>
            <div>
              <span className="font-script text-base font-bold text-[#EF4B35] rotate-[-2deg] inline-block">
                ★ External Registration Policy
              </span>
              <h2 className="font-grotesk text-2xl font-black text-[#1E1A17] mt-0.5">
                All event registrations are hosted on Unstop
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#1E1A17]/80 max-w-2xl leading-relaxed">
                Participation in Crescendo 2026 hackathons, competitions, robotics battles, and gaming tournaments is registered directly on Unstop. No events are recorded as registered locally on this noticeboard.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="https://unstop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] text-white py-2.5 px-5 font-grotesk text-sm font-bold shadow-[2px_2px_0px_#1E1A17] hover:bg-[#DB3D28] transition-colors"
                >
                  Open My Unstop Dashboard <ExternalLink className="size-4" />
                </a>
                <PrimaryButton href="/events" size="md" variant="cream">
                  Browse Noticeboard Events
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
