import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { PaneSwitch } from "../_components/pane-switch";
import { QueueList } from "../_components/queue-list";

type EventViewItem = components["schemas"]["EventViewItem"];

export default async function Layout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  const events = await apiClient<EventViewItem[]>("/api/events");
  const items = events
    .filter((e) => e.status === "pending")
    .map((e) => ({
      id: e.id,
      title: e.title,
      when: e.starts_at ? formatDateTime(e.starts_at) : "No time yet",
      venue: e.venue_name ?? "No venue yet",
      department: e.department ?? "",
    }));

  return (
    <div className="flex flex-col gap-6">
      <PaneSwitch
        queue={
          <aside aria-label="Approval queue" tabIndex={0} className="flex flex-col gap-3 lg:max-h-[calc(100dvh-128px)] lg:overflow-y-auto">
            <h1 className="text-display font-semibold">Approvals</h1>
            <QueueList items={items} />
          </aside>
        }
      >
        {children}
      </PaneSwitch>
    </div>
  );
}
