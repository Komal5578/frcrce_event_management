import { NextResponse } from "next/server";
import { getCrescendoEventById } from "@/lib/crescendo-events";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const localEvent = getCrescendoEventById(id);
  if (localEvent) {
    return NextResponse.json(localEvent);
  }

  const backendUrl =
    process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";
  const cookieHeader = req.headers.get("cookie");

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}`, {
      headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Event not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl =
    process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";
  const cookieHeader = req.headers.get("cookie");
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl =
    process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";
  const cookieHeader = req.headers.get("cookie");

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}`, {
      method: "DELETE",
      headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
    });
    return new NextResponse(null, { status: res.status });
  } catch (err) {
    return new NextResponse(null, { status: 204 });
  }
}
