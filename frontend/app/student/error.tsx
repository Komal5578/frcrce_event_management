"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { PrimaryButton } from "@/components/board/PrimaryButton";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Student portal error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex items-center justify-center p-6">
      <div className="relative max-w-md w-full rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-8 shadow-[4px_6px_0px_rgba(30,26,23,0.18)] text-center">
        <div className="mx-auto size-14 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17]">
          <AlertCircle className="size-7" />
        </div>
        <span className="font-script text-lg font-bold text-[#EF4B35] mt-4 block rotate-[-2deg]">
          ★ Desk Disruption
        </span>
        <h1 className="font-grotesk text-3xl font-black tracking-[-0.01em] leading-[0.98] mt-1 text-[#1E1A17]">
          Could not open student desk
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#1E1A17]/80">
          We encountered an issue opening your registered events desk. You can retry or head back to the public events board.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-white px-4 py-2.5 font-grotesk text-sm font-bold text-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] hover:bg-[#F4EFE3] transition-colors"
          >
            <RefreshCw className="size-4" /> Try Again
          </button>
          <PrimaryButton href="/events" size="md" variant="red">
            Back to events
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
