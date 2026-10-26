import { NextResponse } from "next/server";
import type { Me, Role } from "@/lib/types";

const DEMO_ACCOUNTS: Record<Role, { email: string; pass: string; id: string; name: string }> = {
  student: {
    email: "student@demo.college.test",
    pass: "demo-password-2026",
    id: "a0000000-0000-0000-0000-000000000004",
    name: "Asha Patel",
  },
  coordinator: {
    email: "coordinator@demo.college.test",
    pass: "demo-password-2026",
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Priya Nair",
  },
  admin: {
    email: "admin@demo.college.test",
    pass: "demo-password-2026",
    id: "a0000000-0000-0000-0000-000000000003",
    name: "Dr. Sunita Rao",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const role: Role = (body?.role as Role) || "student";
    const account = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.student;

    const backendUrl =
      process.env.BACKEND_URL || "https://college-events-api.varadaj47.workers.dev";

    // Attempt login on the backend Cloudflare Worker
    let cookieToSet: string | null = null;
    let me: Me = {
      id: account.id,
      email: account.email,
      name: account.name,
      role,
    };

    try {
      const loginRes = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, password: account.pass }),
      });

      if (loginRes.ok) {
        cookieToSet = loginRes.headers.get("set-cookie");
        const cookieForMe = cookieToSet ? cookieToSet.split(";")[0] : "";
        const meRes = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { cookie: cookieForMe },
        });
        if (meRes.ok) {
          me = await meRes.json();
        }
      }
    } catch (err) {
      console.warn("Backend auth worker offline or unreachable; using local demo session:", err);
    }

    const res = NextResponse.json(me);
    if (cookieToSet) {
      res.headers.set("set-cookie", cookieToSet);
    }
    return res;
  } catch (error) {
    return NextResponse.json(
      { code: "INTERNAL", message: "Demo login failed. Please try again." },
      { status: 500 }
    );
  }
}
