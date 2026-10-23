import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { splitAlerts, type AlertItem } from "@/lib/domain/alerts";

export type AttentionListProps = {
  items: AlertItem[];
  heading?: string;
  emptyText?: string;
  limit?: number;
};

export function AttentionList({
  items,
  heading,
  emptyText = "Nothing needs attention.",
  limit = 5,
}: AttentionListProps) {
  const { shown, rest } = splitAlerts(items, limit);
  const n = items.length;

  return (
    <section className="flex flex-col gap-3">
      {n === 0 ? (
        <div className="flex items-center gap-2 text-muted">
          <CircleCheck size={20} aria-hidden="true" className="text-status-open-fg" />
          <p className="text-body">{emptyText}</p>
        </div>
      ) : (
        <>
          <h2 className="text-heading font-semibold">
            {heading ?? `Needs attention: ${n}`}
          </h2>
          <ul className="flex flex-col gap-2">
            {shown.map((item) => (
              <li
                key={item.key}
                className="flex flex-wrap items-center gap-3 rounded-control border border-border-card bg-surface p-2 sm:px-4"
              >
                <StatusBadge status={item.kind} />
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-body underline flex-1 hover:text-accent"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
          {rest.length > 0 && (
            <details className="mt-1">
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-label font-semibold text-accent hover:underline">
                Show {rest.length} more
              </summary>
              <ul className="flex flex-col gap-2 mt-2">
                {rest.map((item) => (
                  <li
                    key={item.key}
                    className="flex flex-wrap items-center gap-3 rounded-control border border-border-card bg-surface p-2 sm:px-4"
                  >
                    <StatusBadge status={item.kind} />
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center text-body underline flex-1 hover:text-accent"
                    >
                      {item.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
