import { NextResponse } from "next/server";
import { CRESCENDO_EVENTS } from "@/lib/crescendo-events";
import type { EventItem } from "@/lib/types";

const GENERIC_TITLES = new Set([
  "cad basics seminar",
  "research reading circle",
  "open mic night",
  "annual tech fest keynote",
]);

export async function GET(req: Request) {
  const backendUrl =
    process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";
  const cookieHeader = req.headers.get("cookie");

  let backendEvents: EventItem[] = [];

  if (cookieHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/events`, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
      if (res.ok) {
        const data: EventItem[] = await res.json();
        backendEvents = data.filter(
          (e) => !GENERIC_TITLES.has(e.title?.toLowerCase().trim())
        );
      }
    } catch (err) {
      console.warn("Could not reach backend events; returning canonical Crescendo dataset:", err);
    }
  }

  // Merge any user-created events with canonical Crescendo events
  const existingIds = new Set(backendEvents.map((e) => e.id));
  const merged = [
    ...backendEvents,
    ...CRESCENDO_EVENTS.filter((e) => !existingIds.has(e.id)),
  ];

  return NextResponse.json(merged);
}

export async function POST(req: Request) {
  const backendUrl =
    process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";
  const cookieHeader = req.headers.get("cookie");
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${backendUrl}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { code: "INTERNAL", message: "Failed to create event" },
      { status: 500 }
    );
  }
}
