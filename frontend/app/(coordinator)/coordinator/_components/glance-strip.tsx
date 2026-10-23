import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import type { monitorModel } from "../_lib/monitor";

/** CO-07 glance strip: registrations vs capacity, tasks, status. Counts only, never names. */
export function GlanceStrip({ status, m }: { status: string; m: ReturnType<typeof monitorModel> }) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),1fr))]">
      <Card className="flex flex-col gap-2">
        <h2 className="text-label font-semibold">Registrations</h2>
        <p className="text-display font-semibold tabular-nums">{m.seatText}</p>
        <progress max={100} value={m.seatPercent} aria-label="Seats taken" className="h-3 w-full accent-accent" />
        <p className="text-body">{m.seatPercent}% full</p>
        <p className="text-body">{m.waitlist} on the waitlist</p>
        {m.lowReg && <div><StatusBadge status="lowreg" /></div>}
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-label font-semibold">Tasks</h2>
        <p className="text-display font-semibold tabular-nums">{m.overdue} overdue</p>
        {m.overdue > 0 && <div><StatusBadge status="overdue" /></div>}
        <p className="text-body">{m.tasksTotal} {m.tasksTotal === 1 ? "task" : "tasks"}, {m.tasksDone} done</p>
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-label font-semibold">Status</h2>
        <div><StatusBadge status={status as StatusKey} /></div>
        {m.next && <p className="text-body">{m.next}</p>}
      </Card>
    </div>
  );
}
