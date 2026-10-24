import { cn } from "@/lib/cn";

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn("skeleton", className)} />;

export function ListSkeleton({ rows = 4, h = "h-24" }: { rows?: number; h?: string }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={cn("w-full rounded-2xl", h)} />)}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
