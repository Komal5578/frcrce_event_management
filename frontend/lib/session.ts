import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "session";
const MAX_AGE = 7 * 24 * 60 * 60;

export const SESSION_COOKIE_OPTIONS = (isProd: boolean) =>
  ({ httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE, secure: isProd }) as const;

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function hashToken(token: string) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))));
}

/** Creates a session row (hash only) and sets the cookie (raw token). */
export async function createSession(userId: string) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const expires = new Date(Date.now() + MAX_AGE * 1000).toISOString(); // matches schema GLOB format
  await getDb().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await hashToken(token), userId, expires).run();
  (await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS(process.env.NODE_ENV === "production"));
}

export async function readSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getDb()
    .prepare(
      `SELECT p.id, p.name, p.role FROM sessions s JOIN profiles p ON p.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(await hashToken(token), new Date().toISOString())
    .first<{ id: string; name: string; role: string }>();
}

export async function deleteSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hashToken(token)).run();
  jar.delete(SESSION_COOKIE);
}
