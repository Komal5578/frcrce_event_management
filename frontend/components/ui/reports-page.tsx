"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Printer } from "lucide-react";

export type KpiCard = {
  label: string;
  value: string | number;
  description?: string;
};

export type ChartDataPoint = {
  name: string;
  registered: number;
  capacity: number;
};

export type ReportsPageProps = {
  title: string;
  who: string;
  generatedAt: string;
  filtersText?: string;
  kpis: KpiCard[];
  chartData: ChartDataPoint[];
  exportHref: string;
};

export function safeCsvCell(val: unknown): string {
  const s = String(val ?? "");
  // Prevent formula injection: prefix with apostrophe if starts with =, +, -, @
  if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function KpiStat({ label, value, description }: KpiCard) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border-card bg-surface p-5 shadow-sm">
      <p className="text-fine font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-display font-bold tabular-nums text-ink">{value}</p>
      {description && <p className="text-fine text-muted">{description}</p>}
    </div>
  );
}

/** Unified ReportsPage with Recharts horizontal bar chart + accessible table fallback. */
export function ReportsPage({
  title,
  who,
  generatedAt,
  filtersText,
  kpis,
  chartData,
  exportHref,
}: ReportsPageProps) {
  const formattedDate = new Date(generatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-ink">{title}</h1>
          <p className="mt-1 text-label text-muted">
            Generated {formattedDate} · By {who}
            {filtersText && ` · Filters: ${filtersText}`}
          </p>
        </div>
        <div className="flex gap-2" data-no-print>
          <a
            href={exportHref}
            download="events-report.csv"
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-ui bg-surface px-4 text-label font-semibold text-ink transition-colors hover:bg-panel"
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-ui bg-surface px-4 text-label font-semibold text-ink transition-colors hover:bg-panel"
          >
            <Printer size={16} aria-hidden="true" />
            Print
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Key metrics</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <KpiStat key={k.label} {...k} />
          ))}
        </div>
      </section>

      {/* Chart + accessible table */}
      {chartData.length > 0 && (
        <section aria-labelledby="chart-heading">
          <h2 id="chart-heading" className="mb-4 text-heading font-semibold text-ink">
            Attendance vs Capacity
          </h2>

          {/* Recharts — themed via CSS vars */}
          <div
            className="rounded-card border border-border-card bg-surface p-4 shadow-sm"
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 44)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-card)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--color-border-card)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "var(--color-ink)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border-card)",
                    borderRadius: "8px",
                    color: "var(--color-ink)",
                    fontSize: 13,
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "var(--color-muted)", fontSize: 12 }}
                />
                <Bar
                  dataKey="capacity"
                  name="Capacity"
                  fill="var(--color-border-ui)"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="registered"
                  name="Registered"
                  fill="var(--color-accent)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Screen-reader accessible table */}
          <table className="sr-only">
            <caption>Attendance vs Capacity by Event</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Registered</th>
                <th scope="col">Capacity</th>
                <th scope="col">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{row.registered}</td>
                  <td>{row.capacity}</td>
                  <td>
                    {row.capacity > 0
                      ? `${Math.round((row.registered / row.capacity) * 100)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
