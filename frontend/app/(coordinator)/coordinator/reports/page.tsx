import Link from "next/link";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { parseFilters } from "@/lib/rules";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { ReportView } from "@/components/ui/report-view";
import { Button } from "@/components/ui/button";
import { STATUS_META, type StatusKey } from "@/components/ui/status-badge";

type ReportItem = components["schemas"]["ReportItem"];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "open", label: "Open" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function CoordinatorReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole("coordinator");
  const rawParams = await searchParams;

  const flattenedParams: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(rawParams)) {
    if (typeof val === "string") {
      flattenedParams[key] = val;
    } else if (Array.isArray(val) && val[0]) {
      flattenedParams[key] = val[0];
    }
  }

  const filters = parseFilters(flattenedParams);

  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);
  const qString = qs.toString();

  const report = await apiClient<ReportItem>(`/api/reports${qString ? `?${qString}` : ""}`);

  const activeFilters: string[] = [];
  if (filters.status) {
    const label = STATUS_META[filters.status as StatusKey]?.label ?? filters.status;
    activeFilters.push(`Status: ${label}`);
  }
  if (filters.from) activeFilters.push(`From: ${filters.from}`);
  if (filters.to) activeFilters.push(`To: ${filters.to}`);
  const filtersText = activeFilters.join(", ");

  const exportHref = `/coordinator/reports/export${qString ? `?${qString}` : ""}`;
  const who = `${ROLE_LABEL[profile.role]}: ${profile.name}`;

  return (
    <div className="flex flex-col gap-6">
      <form
        method="GET"
        data-no-print
        className="flex flex-wrap items-end gap-4 rounded-card border border-border-card bg-panel p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status" className="text-label font-semibold text-ink">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-control border border-border-ui bg-surface px-3 py-2 text-body text-ink min-h-11"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-from" className="text-label font-semibold text-ink">
            From date
          </label>
          <input
            type="date"
            id="filter-from"
            name="from"
            defaultValue={filters.from ?? ""}
            className="rounded-control border border-border-ui bg-surface px-3 py-2 text-body text-ink min-h-11"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-to" className="text-label font-semibold text-ink">
            To date
          </label>
          <input
            type="date"
            id="filter-to"
            name="to"
            defaultValue={filters.to ?? ""}
            className="rounded-control border border-border-ui bg-surface px-3 py-2 text-body text-ink min-h-11"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          {(filters.status || filters.from || filters.to) && (
            <Link
              href="/coordinator/reports"
              className="text-body text-accent hover:underline min-h-11 inline-flex items-center"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <ReportView
        title="My events report"
        who={who}
        generatedAt={report.generatedAt}
        filtersText={filtersText}
        columns={report.columns.map((c) => ({ key: c.key ?? "", label: c.label ?? "" }))}
        rows={report.rows as Record<string, string | number | null>[]}
        totals={{ events: report.totals.events ?? 0, registered: report.totals.registered ?? 0 }}
        exportHref={exportHref}
      />
    </div>
  );
}
