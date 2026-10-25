import { cn } from "@/lib/cn";
import { STATUS_META, type StatusKey } from "@/lib/status";

/** Status badge using the locked Campus Noticeboard palette */
export function StatusBadge({ status, label, className }: { status: StatusKey; label?: string; className?: string }) {
  const meta = STATUS_META[status] ?? { label: status, icon: () => null };
  const { label: text, icon: Icon } = meta;
  return (
    <span
      data-s={status}
      className={cn(
        "status inline-flex min-h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 font-grotesk text-xs font-bold uppercase tracking-wider leading-none",
        "border border-[#1E1A17]/30",
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2.4} aria-hidden />
      {label ?? text}
    </span>
  );
}
