import { ChevronRight } from "lucide-react";
import { STATUS_META, type StatusKey } from "@/lib/status";
import { cn } from "@/lib/cn";

const stages: StatusKey[] = ["draft", "pending", "approved", "open", "ongoing", "completed"];

/** The mockup's workflow strip, with live counts: where each of your events is right now. */
export function StageStrip({ counts }: { counts: Partial<Record<StatusKey, number>> }) {
  return (
    <ol aria-label="Your events by stage" className="relative mb-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-3">
      {stages.map((s, i) => {
        const { label, icon: Icon } = STATUS_META[s];
        const n = counts[s] ?? 0;
        return (
          <li key={s} className="flex flex-1 items-center">
            <div data-s={s} className={cn("status flex min-h-14 flex-1 items-center gap-2.5 rounded-xl px-3.5", n === 0 && "opacity-60")}>
              <Icon className="size-[18px] shrink-0" aria-hidden />
              <span className="min-w-0 leading-tight"><span className="num block text-xl font-extrabold">{n}</span><span className="block whitespace-nowrap text-[13px] font-semibold">{label}</span></span>
            </div>
            {i < stages.length - 1 ? <ChevronRight className="mx-0.5 size-4 shrink-0 text-faint" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
