import { CircleCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ClashResult } from "../_lib/clash";

export function ClashCheck({ check, resources }: { check: ClashResult; resources: { name: string; asked: number; free: number }[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading font-semibold">Clash check</h2>
      {check.ok ? (
        <p className="flex items-start gap-2 text-body"><CircleCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0" />{check.message}</p>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <StatusBadge status="clash" />
          <p className="text-body">{check.message}</p>
        </div>
      )}
      {resources.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Resources">
          {resources.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center gap-2 text-body">
              {r.asked <= r.free ? <CircleCheck size={16} aria-hidden="true" /> : <StatusBadge status="clash" />}
              {r.name} x{r.asked}, {Math.max(r.free, 0)} free
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
