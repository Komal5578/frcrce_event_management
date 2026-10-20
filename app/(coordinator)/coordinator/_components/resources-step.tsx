"use client";

import { useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/field";
import { setAllocationAction } from "../actions";

type Row = { id: string; name: string; total: number; left: number | null; qty: number };

/** Step 3: checkbox + quantity per resource. Each change is saved at once (reversible, no confirm). */
export function ResourcesStep({ eventId, rows }: { eventId: string; rows: Row[] }) {
  const [qty, setQty] = useState<Record<string, number>>(Object.fromEntries(rows.map((r) => [r.id, r.qty])));
  const [err, setErr] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");
  const [, start] = useTransition();

  const save = (id: string, q: number) => {
    setQty((s) => ({ ...s, [id]: q }));
    start(async () => {
      const r = await setAllocationAction(eventId, id, q);
      setErr((s) => ({ ...s, [id]: r.error ?? "" }));
      setSaved(r.ok ? "Saved just now" : "");
    });
  };
  const avail = (r: Row) => r.left === null ? `${r.total} in total` : r.left <= 0 ? "All booked: cannot be requested" : `${r.left} free`;

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="text-body">Tick what you need. Availability is for your date and time.</p>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const on = (qty[r.id] ?? 0) > 0;
          return (
            <li key={r.id} className="flex flex-col gap-2 rounded-control border border-border-card bg-panel px-4 py-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={on} className="size-5 accent-accent" onChange={(e) => save(r.id, e.target.checked ? 1 : 0)} />
                  <span><span className="text-body font-semibold">{r.name}</span> <span className="text-label text-muted">{avail(r)}</span></span>
                </label>
                {on && (
                  <label className="flex items-center gap-2 text-label font-semibold">
                    Quantity<span className="sr-only"> of {r.name}</span>
                    <Input type="number" min={1} inputMode="numeric" defaultValue={qty[r.id]} className="w-24"
                      onBlur={(e) => { const q = Number(e.target.value); if (Number.isInteger(q) && q >= 0 && q !== qty[r.id]) save(r.id, q); }} />
                  </label>
                )}
              </div>
              {err[r.id] && <p role="alert" className="flex items-center gap-1 text-label font-semibold text-destructive"><CircleAlert size={16} aria-hidden="true" />{err[r.id]}</p>}
            </li>
          );
        })}
      </ul>
      <span aria-live="polite" className="text-label text-muted">{saved}</span>
    </div>
  );
}
