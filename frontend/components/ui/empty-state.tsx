import type { LucideIcon } from "lucide-react";
import { AlertCircle, PinOff } from "lucide-react";
import { Button } from "./button";

/** Say what is missing with a short, cheeky noticeboard tone. */
export function EmptyState({
  icon: Icon = PinOff,
  title = "Nothing pinned yet",
  body = "Board's clear. Check back before fest week or take a nap.",
  action,
}: {
  icon?: LucideIcon;
  art?: unknown;
  title?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[#1E1A17]/30 bg-[#F4EFE3]/60 px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-[#D9CBB3] border border-[#1E1A17]/30 text-[#EF4B35]">
        <Icon className="size-6" aria-hidden />
      </div>
      <h2 className="mt-4 font-grotesk text-xl font-black text-[#1E1A17]">{title}</h2>
      {body ? <p className="mt-1 max-w-sm text-sm font-semibold text-[#1E1A17]/75">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border-[1.5px] border-[#EF4B35] bg-[#FDE9E6] px-6 py-10 text-center text-[#1E1A17]"
    >
      <AlertCircle className="size-8 text-[#EF4B35]" aria-hidden />
      <h2 className="mt-3 font-grotesk text-xl font-black text-[#1E1A17]">Noticeboard Glitch</h2>
      <p className="mt-1 max-w-sm text-sm font-semibold text-[#1E1A17]/80">
        {message ?? "Lost flyer: this notice blew off the board. Check your connection and try again."}
      </p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
