import type { Bar } from "../_lib/dashboard";

/** Flat horizontal bars: one hue, zero-based, value as text (the text is the accessible content). */
export function BarList({ title, bars, max = 100, empty }: { title: string; bars: Bar[]; max?: number; empty: string }) {
  const top = Math.max(max, ...bars.map((b) => b.value), 1);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading font-semibold">{title}</h2>
      {bars.length === 0 ? <p className="text-body text-muted">{empty}</p> : (
        <ul className="flex flex-col gap-3">
          {bars.map((b) => (
            <li key={b.label} className="grid grid-cols-[minmax(6rem,10rem)_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(6rem,10rem)_1fr_auto]">
              <span className="text-body">{b.label}</span>
              <span aria-hidden="true" className="block h-3 rounded-pill bg-border-card">
                <span className="block h-3 rounded-pill bg-muted" style={{ width: `${Math.min(100, (b.value / top) * 100)}%` }} />
              </span>
              <span className="col-start-2 text-label font-semibold tabular-nums sm:col-start-auto">
                {b.text}{b.detail ? ` (${b.detail})` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
