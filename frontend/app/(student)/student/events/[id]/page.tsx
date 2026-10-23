import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { getEventDetail, type EventView } from "@/lib/domain/views";
import { formatRange } from "@/lib/format";
import { CancelFlow } from "../../_components/cancel-flow";
import { RegisterFlow } from "../../_components/register-flow";
import { detailModel } from "../../_lib/view";

export const metadata = { title: "Event - College Events" };
export const dynamic = "force-dynamic";

const Back = () => <Link href="/student" className="inline-flex min-h-11 items-center font-semibold text-accent underline">Back to Discover</Link>;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const p = await requireRole("student");
  const { id } = await params;
  let e: EventView;
  try {
    e = await getEventDetail({ id: p.id, role: p.role }, id);
  } catch (err) {
    if (!(err instanceof DomainError)) throw err; // unexpected: error.tsx
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="You cannot see this event">It may have been removed or is not open to you.</Alert>
        <Back />
      </div>
    );
  }
  const m = detailModel(e);
  const when = e.starts_at && e.ends_at ? formatRange(e.starts_at, e.ends_at) : "Time to be confirmed";
  const where = [e.venue_name, e.venue_location].filter(Boolean).join(", ") || "Venue to be confirmed";
  const regBadge = m.mine ? m.mine.key : e.my_reg === "cancelled" ? "cancelled" : null;

  return (
    <div className="flex flex-col gap-6">
      <Back />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-display font-semibold">{e.title}</h1>
        <StatusBadge status={m.status} />
        {regBadge && <StatusBadge status={regBadge} />}
      </div>
      <dl className="grid max-w-[65ch] grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
        <dt className="font-semibold">When</dt><dd>{when}</dd>
        <dt className="font-semibold">Where</dt><dd>{where}</dd>
        <dt className="font-semibold">Seats</dt><dd>{m.seatsDetail}</dd>
        <dt className="font-semibold">Hosted by</dt><dd>{e.coordinator_name ?? "College events team"}</dd>
        {e.description && <><dt className="font-semibold">About</dt><dd>{e.description}</dd></>}
      </dl>
      {m.waitlistNote && <p className="text-body font-semibold">{m.waitlistNote}</p>}
      {e.my_reg === "cancelled" && <p className="text-body">You cancelled your registration. Your seat was released.</p>}
      {m.cta !== "none" && <RegisterFlow eventId={e.id} title={e.title} when={when} where={where} mode={m.cta} primary />}
      {m.mine && <CancelFlow eventId={e.id} title={e.title} when={when} waitlisted={m.mine.key === "waitlisted"} />}
    </div>
  );
}
