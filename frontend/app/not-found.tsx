import Link from "next/link";
import { PinOff } from "lucide-react";
import { PrimaryButton } from "@/components/board/PrimaryButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex items-center justify-center p-6">
      <div className="relative max-w-md w-full rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-8 shadow-[4px_6px_0px_rgba(30,26,23,0.18)] text-center">
        <div className="mx-auto size-14 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17]">
          <PinOff className="size-7" />
        </div>
        <span className="font-script text-lg font-bold text-[#EF4B35] mt-4 block rotate-[-2deg]">
          ★ Lost Notice Notice
        </span>
        <h1 className="font-grotesk text-3xl font-black tracking-[-0.01em] leading-[0.98] mt-1 text-[#1E1A17]">
          Nothing pinned here
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#1E1A17]/80">
          This flyer either blew away in the monsoon wind or was moved to another board.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <PrimaryButton href="/" size="md" variant="red">
            Back to Noticeboard
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
