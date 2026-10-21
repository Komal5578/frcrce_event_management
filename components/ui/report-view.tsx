import { Download } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { STATUS_META, StatusBadge, type StatusKey } from "./status-badge";
import { PrintButton } from "./print-button";
import { EmptyState } from "./empty-state";

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportRow = Record<string, string | number | null>;

export type ReportTotals = {
  events: number;
  registered: number;
};

export type ReportViewProps = {
  title: string;
  who: string;
  generatedAt: string;
  filtersText: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: ReportTotals;
  exportHref: string;
};

function labelToStatusKey(val: unknown): StatusKey | null {
  if (typeof val !== "string") return null;
  for (const [k, v] of Object.entries(STATUS_META)) {
    if (v.label.toLowerCase() === val.toLowerCase() || k.toLowerCase() === val.toLowerCase()) {
      return k as StatusKey;
    }
  }
  return null;
}

export function ReportView({
  title,
  who,
  generatedAt,
  filtersText,
  columns,
  rows,
  totals,
  exportHref,
}: ReportViewProps) {
  const formattedDate = formatDateTime(generatedAt);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-bold text-ink">{title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted">
          <span>Generated: {formattedDate}</span>
          <span aria-hidden="true">•</span>
          <span>By: {who}</span>
          <span aria-hidden="true">•</span>
          <span>Filters: {filtersText || "No filters"}</span>
        </div>
      </div>

      <div data-no-print className="flex flex-wrap items-center gap-3">
        <a
          href={exportHref}
          download="events-report.csv"
          data-no-print
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control border border-accent bg-accent px-4 py-2 text-label font-semibold text-white transition-colors duration-150 hover:bg-accent/90"
        >
          <Download size={18} aria-hidden="true" />
          Download CSV
        </a>
        <PrintButton />
      </div>

      <p className="text-label font-semibold text-ink">
        {totals.events} events, {totals.registered} registered
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No events match"
          body="Change the filters or check back after events are created."
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border-card bg-surface shadow-sm">
          <table className="w-full border-collapse text-left text-body">
            <caption className="sr-only">{title}</caption>
            <thead className="border-b border-border-card bg-panel text-label font-semibold text-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col" className="px-4 py-3 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-panel/50 transition-colors">
                  {columns.map((col, j) => {
                    const raw = row[col.key];
                    if (j === 0) {
                      return (
                        <th
                          key={col.key}
                          scope="row"
                          className="px-4 py-3 font-semibold text-ink whitespace-nowrap"
                        >
                          {String(raw ?? "—")}
                        </th>
                      );
                    }
                    if (col.key === "status") {
                      const statusKey = labelToStatusKey(raw);
                      return (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {statusKey ? (
                            <StatusBadge status={statusKey} />
                          ) : (
                            String(raw ?? "—")
                          )}
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap text-ink">
                        {String(raw ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
