"use server";

import { redirect } from "next/navigation";
import { demoEmail, findLoginUser, homeFor, isDemoEnabled, parseRole, type LoginRow } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string; fieldErrors?: { email?: string; password?: string } };

const WRONG = "We could not sign you in. Check your email and password, then try again, or use a demo button above.";
const NETWORK = "Sign in did not work because we could not reach the server. Check your connection and try again.";
// Verified when the user is missing so timing and message match a wrong password (T-03-09-04).
const DUMMY = "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

type Row = LoginRow;
const findByEmail = findLoginUser;

async function start(row: Row): Promise<LoginState> {
  const role = parseRole(row.role);
  if (!role) return { error: WRONG };
  try {
    await createSession(row.id);
  } catch {
    return { error: NETWORK };
  }
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

  let row: Row | null;
  try {
    row = await findByEmail(email);
  } catch {
    return { error: NETWORK };
  }
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY);
  if (!row || !ok) return { error: WRONG };
  return start(row);
}

export async function demoLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Server-side gate: hiding the buttons is not enough (T-03-19). No password is checked or hashed here.
  if (!isDemoEnabled()) return { error: WRONG };
  const role = parseRole(formData.get("role"));
  if (!role) return { error: WRONG };
  let row: Row | null;
  try {
    row = await findByEmail(demoEmail(role));
  } catch {
    return { error: NETWORK };
  }
  if (!row) return { error: WRONG };
  return start(row);
}

export async function signOut() {
  await deleteSession();
  redirect("/login");
}
