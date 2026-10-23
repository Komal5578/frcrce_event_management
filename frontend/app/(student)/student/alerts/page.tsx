import { Bell, CalendarCheck, ClipboardList, Info, UserCheck, type LucideIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { AttentionList } from "@/components/ui/attention-list";

export const metadata = { title: "Alerts - College Events" };
export const dynamic = "force-dynamic";

type NotificationItem = components["schemas"]["NotificationItem"];
type AlertItem = components["schemas"]["AlertItem"];

const ICONS: Record<string, LucideIcon> = { waitlist_promoted: UserCheck, task_assigned: ClipboardList, event_approved: CalendarCheck };
const WEEK = 7 * 86_400_000;

export default async function Page() {
  await requireRole("student");
  const now = new Date();

  const [items, alerts] = await Promise.all([
    apiClient<NotificationItem[]>("/api/notifications").catch(() => []),
    apiClient<AlertItem[]>("/api/notifications/alerts").catch(() => []),
  ]);


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">Alerts</h1>

      {alerts.length > 0 && <AttentionList items={alerts} />}

      {items.length === 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-heading font-semibold">Nothing new</h2>
          <p className="text-body">Reminders and changes to your events will show up here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => {
            const Icon = ICONS[n.kind ?? ""] ?? (n.kind ? Info : Bell);
            return (
              <li key={n.id} className="flex gap-3 rounded-control border border-border-card bg-surface p-4">
                <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-body">
                    {now.getTime() - new Date(n.created_at).getTime() < WEEK && <strong className="mr-2 text-label">New</strong>}
                    {n.body}
                  </p>
                  <p className="text-label text-muted">{formatDateTime(n.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
