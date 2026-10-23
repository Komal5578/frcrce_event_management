"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type Role, homeFor, isDemoEnabled, parseRole } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export type LoginState = { error?: string; fieldErrors?: { email?: string; password?: string } };

const WRONG = "We could not sign you in. Check your email and password, then try again, or use a demo button above.";
const NETWORK = "Sign in did not work because we could not reach the server. Check your connection and try again.";

const apiBase = () => process.env.API_URL || "http://127.0.0.1:8000";

/** Asks FastAPI to start a session, then copies its cookie onto this origin. Redirects on success. */
async function startSession(path: "login" | "demo-login", body: object): Promise<LoginState> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: NETWORK };
  }
  if (!res.ok) return { error: WRONG };

  const data = (await res.json()) as { role?: unknown };
  const role: Role | null = parseRole(data.role);
  const token = res.headers.get("set-cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  if (!role || !token) return { error: NETWORK };

  (await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS(process.env.NODE_ENV === "production"));
  // Fixed role home only; no request-supplied target (T-03-17). redirect throws, so it stays outside try/catch.
  redirect(homeFor(role));
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: NonNullable<LoginState["fieldErrors"]> = {};
  if (!email) fieldErrors.email = "Enter your email address, for example name@college.edu.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors };

  return startSession("login", { email, password });
}

export async function demoLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Server-side gate: hiding the buttons is not enough (T-03-19). The backend checks its own flag too.
  if (!isDemoEnabled()) return { error: WRONG };
  const role = parseRole(formData.get("role"));
  if (!role) return { error: WRONG };

  return startSession("demo-login", { role });
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await fetch(`${apiBase()}/api/auth/logout`, {
        method: "POST",
        headers: { cookie: `${SESSION_COOKIE}=${token}` },
      });
    } catch {
      // Backend unreachable: still clear the local cookie below.
    }
  }
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
