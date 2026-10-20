import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarX, ClipboardList, FilePen, ShieldCheck, Undo2, type LucideIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listNotifications } from "@/lib/domain/notifications";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications - College Events" };

const ICON: Record<string, LucideIcon> = {
  task_assigned: ClipboardList, event_approved: ShieldCheck, event_returned: Undo2, event_changed: FilePen, event_cancelled: CalendarX,
};
const WEEK_MS = 7 * 86_400_000;

export default async function Page() {
  const p = await requireRole("coordinator");
  const list = await listNotifications({ id: p.id, role: p.role });
  const now = new Date();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">Notifications</h1>
      {list.length === 0 ? (
        <div className="rounded-control border border-border-card bg-panel p-6">
          <h2 className="text-heading font-semibold">Nothing new</h2>
          <p className="text-body">Changes to your events will show up here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((n) => {
            const Icon = (n.kind && ICON[n.kind]) || Bell;
            return (
              <li key={n.id} className="flex gap-3 rounded-control border border-border-card bg-panel p-4">
                <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-body">{n.body}</p>
                  <p className="text-label text-muted">
                    {formatDateTime(n.created_at)}
                    {now.getTime() - new Date(n.created_at).getTime() < WEEK_MS && <strong className="ml-2 text-ink">New</strong>}
                    {n.event_id && <> · <Link href={`/coordinator/${n.event_id}`} className="underline">View event</Link></>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
