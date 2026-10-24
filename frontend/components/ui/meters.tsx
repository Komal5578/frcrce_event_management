// Chart-free meters (no Recharts), so screens that only need these stay light.

/** Thin progress ring used on the student app (as in the mockup). */
export function Ring({ value, label, size = 96, color = "var(--purple)" }: { value: number; label: string; size?: number; color?: string }) {
  const r = 42, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(pct)} percent`}>
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center"><span className={size < 90 ? "num text-[15px] font-extrabold text-ink" : "num text-lg font-extrabold text-ink"}>{Math.round(pct)}%</span></div>
    </div>
  );
}

/** Ranked rows: full names, a thin proportional bar, the figure at the end. Better than columns for a handful of categories. */
export function BarList({ rows }: { rows: { name: string; value: number; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-bold text-ink">{r.name}</span>
            <span className="num text-lg font-extrabold text-ink">{r.value}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-[var(--chart-1)] transition-[width] duration-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          {r.note ? <p className="num mt-1 text-[13px] text-muted">{r.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}
