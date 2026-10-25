import { Pin } from "lucide-react";

export default function StudentLoading() {
  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex items-center justify-center p-6">
      <div className="relative max-w-sm w-full rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-8 shadow-[4px_6px_0px_rgba(30,26,23,0.18)] text-center">
        <div className="mx-auto size-12 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] animate-bounce">
          <Pin className="size-6 -rotate-45" />
        </div>
        <span className="font-script text-base font-bold text-[#EF4B35] mt-3 block rotate-[-2deg]">
          ★ Student Portal
        </span>
        <h2 className="font-grotesk text-xl font-black text-[#1E1A17] mt-1">
          Opening Student Desk...
        </h2>
        <p className="mt-2 text-xs font-semibold text-[#1E1A17]/70">
          Loading your pinned RSVPs and upcoming notices.
        </p>
      </div>
    </div>
  );
}
