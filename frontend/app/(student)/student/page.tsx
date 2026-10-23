import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { EventCard } from "./_components/event-card";
import { FilterChips } from "./_components/filter-chips";
import { RegistrationStrip } from "./_components/registration-strip";
import { applyFilters, distinct, echoText, parseParams } from "./_lib/filter";
import { group } from "./_lib/mine";
import { cardModel } from "./_lib/view";

type MyProfile = components["schemas"]["MyProfileItem"];
type EventView = components["schemas"]["EventViewItem"];
type MyRegistration = components["schemas"]["RegistrationItem"];
type Venue = components["schemas"]["VenueItem"];

export const metadata = { title: "Discover events - College Events" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await requireRole("student");
  const sp = await searchParams;
  const now = new Date();
  const [me, events, regs, venues] = await Promise.all([
    apiClient<MyProfile>("/api/people/me").catch(() => ({ id: p.id, name: p.name, department: null, is_organizer: false })),
    apiClient<EventView[]>("/api/events").catch(() => []),
    apiClient<MyRegistration[]>("/api/registrations/mine").catch(() => []),
    apiClient<Venue[]>("/api/venues").catch(() => []),
  ]);
  const params = parseParams(sp, me.department ?? null);
  const shown = applyFilters(events, params, now);

  const firstActionable = shown.findIndex((e) => cardModel(e).cta !== "none");


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display font-semibold">Discover events</h1>
      <RegistrationStrip upcoming={group(regs, now).comingUp} now={now} />
      <FilterChips
        p={params}
        types={distinct(events.map((e) => e.type))}
        venues={distinct(venues.map((v) => v.name))}
        departments={distinct([...events.map((e) => e.department), me.department])}
        echo={echoText(params, shown.length)}
      />
      {shown.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <h2 className="text-heading font-semibold">No events match</h2>
          <p className="text-body">Clear a filter to see more.</p>
          <Link href="/student?f=1" className="inline-flex min-h-11 items-center text-label font-semibold text-accent underline">Clear filters</Link>
        </div>
      ) : (
        <section aria-label="Events">
          <ul className="grid gap-4 md:grid-cols-2">
            {shown.map((e, i) => <EventCard key={e.id} e={e} primary={i === firstActionable} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
