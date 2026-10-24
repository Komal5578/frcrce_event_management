import { cn } from "@/lib/cn";
import { STATUS_META, type StatusKey } from "@/lib/status";

/** Never colour alone: icon + word + colour. */
export function StatusBadge({ status, label, className }: { status: StatusKey; label?: string; className?: string }) {
  const { label: text, icon: Icon } = STATUS_META[status];
  return (
    <span
      data-s={status}
      className={cn("status inline-flex min-h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none", className)}
    >
      <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      {label ?? text}
    </span>
  );
}
