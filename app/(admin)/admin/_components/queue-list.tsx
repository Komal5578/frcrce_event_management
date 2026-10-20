"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

export type QueueItem = { id: string; title: string; when: string; venue: string; department: string };

/** Pending events, soonest first; the open one carries an accent bar and aria-current. */
export function QueueList({ items }: { items: QueueItem[] }) {
  const path = usePathname();
  if (items.length === 0)
    return (
      <div className="flex flex-col gap-1 p-4">
        <p className="text-heading font-semibold">No events are waiting</p>
        <p className="text-body text-muted">You are all caught up.</p>
      </div>
    );
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => {
        const current = path === `/admin/approvals/${i.id}`;
        return (
          <li key={i.id}>
            <Link
              href={`/admin/approvals/${i.id}`}
              aria-current={current ? "true" : undefined}
              className={`flex min-h-11 flex-col gap-1 rounded-control border border-border-card border-l-4 bg-surface p-3 ${current ? "border-l-accent bg-panel" : "border-l-transparent"}`}
            >
              <span className="text-body font-semibold">{i.title}</span>
              <span className="text-label text-muted">{i.when}</span>
              <span className="text-label text-muted">{i.venue}{i.department ? `, ${i.department}` : ""}</span>
              <span><StatusBadge status="pending" /></span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
