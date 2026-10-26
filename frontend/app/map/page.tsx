import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/board/Nav";
import { CampusMapClient } from "@/components/map/CampusMapClient";
import { filterCrescendoEvents } from "@/lib/crescendo-events";
import type { EventItem } from "@/lib/types";

export const metadata = {
  title: "Crescendo Campus Map | FrCRCE Events",
  description: "Find your Crescendo event: floor plans, live venue status, and walking routes.",
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; floor?: string; entity?: string; from?: string }>;
}) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  // Strict server-side access check
  if (!session || !session.value) {
    const returnUrl = `/map${
      resolvedParams.event ? `?event=${encodeURIComponent(resolvedParams.event)}` : ""
    }`;
    redirect(`/login?next=${encodeURIComponent(returnUrl)}&reason=map`);
  }

  // Fetch events server-side using the first-party session cookie
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  let events: EventItem[] = [];

  try {
    const res = await fetch(`${backendUrl}/api/events`, {
      headers: {
        cookie: `session=${session.value}`,
      },
      next: { revalidate: 30 }, // Cached for weak network resilience
    });

    if (res.ok) {
      events = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch events for map:", err);
  }

  return (
    <div className="min-h-screen bg-[#F4EFE3] flex flex-col justify-between">
      <Nav />
      <main className="flex-1 flex flex-col">
        <CampusMapClient
          initialEvents={filterCrescendoEvents(events)}
          initialEventId={resolvedParams.event}
          initialFloorId={resolvedParams.floor}
        />
      </main>
      <footer className="border-t border-[#1E1A17]/20 bg-[#F4EFE3] py-6 px-4 text-center text-xs font-semibold text-[#1E1A17]/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong className="text-[#1E1A17]">FrCRCE Crescendo Campus Map</strong> · Bandra Bandstand
          </p>
          <p className="font-script text-sm text-[#EF4B35]">
            Lost on campus? Visit the Ground Floor Reception Desk
          </p>
          <p className="text-[#1E1A17]/60">
            Fr. Conceicao Rodrigues College of Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}
