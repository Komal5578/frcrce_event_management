"use client";

import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Slice = { name: string; value: number; color: string };

const tip = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13, color: "var(--ink)", boxShadow: "var(--shadow-card)" },
  itemStyle: { color: "var(--ink)" },
  labelStyle: { color: "var(--muted)", fontWeight: 600 },
  cursor: { fill: "var(--brand-soft)" },
};
const axis = { fontSize: 12, fill: "var(--muted)" };

/** Donut with a plain legend that carries the numbers (never labels on slices). */
export function Donut({ data, center, sub, size = 168 }: { data: Slice[]; center: string; sub: string; size?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <table className="sr-only"><caption>{center} {sub}</caption><thead><tr><th scope="col">Group</th><th scope="col">Events</th></tr></thead><tbody>{data.map((d) => <tr key={d.name}><th scope="row">{d.name}</th><td className="text-right">{d.value}</td></tr>)}</tbody></table>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={total ? data : [{ name: "None", value: 1, color: "var(--line)" }]} dataKey="value" innerRadius="68%" outerRadius="100%" stroke="var(--surface)" strokeWidth={2} paddingAngle={total ? 1 : 0} startAngle={90} endAngle={-270} animationDuration={900}>
              {(total ? data : [{ color: "var(--line)" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="num text-2xl font-extrabold leading-none text-ink">{center}</p><p className="mt-1 text-xs font-semibold text-muted">{sub}</p></div>
        </div>
      </div>
      <ul className="min-w-36 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
            <span className="flex-1 text-muted">{d.name}</span>
            <span className="num font-bold text-ink">{d.value}</span>
            <span className="num w-10 text-right text-xs text-faint">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Trend({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number | string }) {
  return (
    <div className="relative" style={{ height }}>
      <table className="sr-only"><caption>Events per week, by start date</caption><thead><tr><th scope="col">Week of</th><th scope="col">Events</th></tr></thead><tbody>{data.map((d) => <tr key={d.name}><th scope="row">{d.name}</th><td className="text-right">{d.value}</td></tr>)}</tbody></table>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line-strong)" }} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tip} cursor={{ stroke: "var(--line-strong)" }} />
          <Line dataKey="value" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--surface)", stroke: "var(--chart-1)", strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
