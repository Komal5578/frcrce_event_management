import { NextResponse } from "next/server";
import { getCrescendoEventById } from "@/lib/crescendo-events";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action || "approve";
  const reason = body?.reason || null;

  const backendUrl =
    process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";
  const cookieHeader = req.headers.get("cookie");

  const localEvent = getCrescendoEventById(id);
  if (localEvent) {
    localEvent.status = action === "approve" ? "approved" : "returned";
    localEvent.return_reason = action === "return" ? reason : null;
    return NextResponse.json({ success: true, status: localEvent.status });
  }

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}/review`, {
      method: "POST",
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
