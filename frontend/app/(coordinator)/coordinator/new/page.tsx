import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listTemplates } from "@/lib/domain/drafts";
import { StartForm } from "../_components/start-form";

export const metadata: Metadata = { title: "New event - College Events" };

const duration = (m: number) => (m % 60 === 0 ? `${m / 60} ${m === 60 ? "hour" : "hours"}` : `${m} minutes`);

export default async function Page() {
  const p = await requireRole("coordinator");
  const templates = await listTemplates({ id: p.id, role: p.role });
  const options = [
    ...templates.map((t) => ({
      id: t.id, name: t.name, description: t.description ?? "",
      defaults: [t.default_capacity ? `${t.default_capacity} seats` : null, t.default_duration_minutes ? duration(t.default_duration_minutes) : null].filter(Boolean).join(", "),
    })),
    { id: "blank", name: "Blank", description: "Start with an empty event and fill in everything yourself.", defaults: "" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display font-semibold">New event</h1>
        <p className="text-body text-muted">Pick a starting point. Your department is filled in for you and the draft saves as you go.</p>
      </div>
      <StartForm options={options} />
    </div>
  );
}
