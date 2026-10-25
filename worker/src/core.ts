// Shared plumbing: error markers, D1 helpers, passwords, sessions, rate limit.
// Port of backend/app/{errors,auth}.py. Error codes and messages are the same as the FastAPI backend.

export type Row = Record<string, any>;
export type Role = "coordinator" | "student" | "admin";
export interface Actor { id: string; role: Role; name: string; email: string }
export interface Env { DB: D1Database; DEMO_LOGIN?: string; LOGIN_MAX_FAILURES?: string; LOGIN_WINDOW_MINUTES?: string }

export const MSG: Record<string, string> = {
  VENUE_CLASH: "That venue is already booked for part of this time. Pick another venue or time.",
  ALREADY_REGISTERED: "You are already registered for this event.",
  NOT_ALLOWED: "You do not have permission to do that.",
  INVALID_INPUT: "Some details are missing or not valid. Check the form and try again.",
  RESOURCE_SHORT: "Not enough of that resource is free for this time. Choose a smaller number or another time.",
  EVENT_FULL: "This event is full. You can join the waitlist instead.",
  BAD_STATE: "This can't be done at the event's current stage. Refresh the page to see where it stands.",
  UNAUTHENTICATED: "You must be signed in to do that.",
  RATE_LIMITED: "Too many sign-in attempts. Please try again in a few minutes.",
  INTERNAL: "Something went wrong on our side. Please try again in a moment.",
};

export const STATUS: Record<string, number> = {
  NOT_ALLOWED: 403, UNAUTHENTICATED: 401, INVALID_INPUT: 422, RATE_LIMITED: 429,
  VENUE_CLASH: 409, EVENT_FULL: 409, RESOURCE_SHORT: 409, BAD_STATE: 409, ALREADY_REGISTERED: 409, INTERNAL: 500,
};

export class DomainError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? MSG[code] ?? MSG.INTERNAL);
  }
}

/** Map a D1/SQLite error (trigger marker or constraint) to a DomainError. */
export function translate(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  const m = String((e as Error)?.message ?? e);
  for (const code of ["VENUE_CLASH", "EVENT_FULL", "RESOURCE_SHORT", "BAD_STATE"]) if (m.includes(code)) return new DomainError(code);
  if (m.includes("UNIQUE constraint failed: registrations")) return new DomainError("ALREADY_REGISTERED");
  if (m.includes("events_complete_unless_draft")) return new DomainError("INVALID_INPUT", "Add a venue, date and capacity before submitting.");
  if (m.includes("events_time_order")) return new DomainError("INVALID_INPUT", "The event must end after it starts.");
  if (/constraint failed/i.test(m)) return new DomainError("INVALID_INPUT");
  console.error("unhandled db error:", m);
  return new DomainError("INTERNAL");
}

// ---- D1 helpers -------------------------------------------------------------------------------
export const all = async (db: D1Database, sql: string, ...p: unknown[]): Promise<Row[]> =>
  (await db.prepare(sql).bind(...p).all<Row>()).results;
export const first = (db: D1Database, sql: string, ...p: unknown[]): Promise<Row | null> =>
  db.prepare(sql).bind(...p).first<Row>();
export const stmt = (db: D1Database, sql: string, ...p: unknown[]) => db.prepare(sql).bind(...p);
/** Run statements atomically (D1 batch = one transaction); trigger errors become DomainErrors. */
export async function batch(db: D1Database, stmts: D1PreparedStatement[]) {
  try { return await db.batch<Row>(stmts); } catch (e) { throw translate(e); }
}
export async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw translate(e); }
}
export const bool = (rows: Row[], ...keys: string[]) =>
  rows.map((r) => { for (const k of keys) r[k] = !!r[k]; return r; });

export const nowIso = () => new Date().toISOString();
export const uuid = () => crypto.randomUUID();

/** Normalise any parseable timestamp to the UTC millisecond form the schema requires. */
export function ts(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new DomainError("INVALID_INPUT");
  return d.toISOString();
}

export function requireRole(actor: Actor, ...roles: Role[]) {
  if (!roles.includes(actor.role)) throw new DomainError("NOT_ALLOWED");
}

// ---- passwords (PBKDF2-SHA256 via WebCrypto; format pbkdf2-sha256$iter$saltB64$hashB64) -------------
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

// Used when the email is unknown so an unknown email costs the same as a wrong password (timing safety).
const DUMMY = "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const parts = (stored ?? DUMMY).split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const want = unb64(parts[3]);
  const got = await pbkdf2(password, unb64(parts[2]), Number(parts[1]));
  let diff = got.length ^ want.length;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ (want[i] ?? 0);
  return stored !== null && diff === 0;
}

// ---- sessions: random token in an httpOnly cookie, only its SHA-256 stored ---------------------------
export const hashToken = async (t: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));

export async function createSession(db: D1Database, userId: string, days = 7): Promise<string> {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const expires = new Date(Date.now() + days * 864e5).toISOString();
  await batch(db, [
    stmt(db, "DELETE FROM sessions WHERE expires_at < ?", nowIso()),
    stmt(db, "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", await hashToken(token), userId, expires),
  ]);
  return token;
}

export async function resolveSession(db: D1Database, token: string): Promise<Actor | null> {
  const r = await first(db,
    `SELECT p.id, p.role, p.name, p.email FROM sessions s JOIN profiles p ON p.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`, await hashToken(token), nowIso());
  return r ? { id: r.id, role: r.role, name: r.name, email: r.email } : null;
}

export const deleteSession = async (db: D1Database, token: string) =>
  void (await stmt(db, "DELETE FROM sessions WHERE token_hash = ?", await hashToken(token)).run());

export async function recentFailures(db: D1Database, email: string, windowMinutes: number): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60000).toISOString();
  const r = await first(db, "SELECT count(*) AS c FROM login_attempts WHERE email = ? AND attempted_at > ?", email, since);
  return r?.c ?? 0;
}
export const recordFailure = async (db: D1Database, email: string) =>
  void (await stmt(db, "INSERT INTO login_attempts (email, attempted_at) VALUES (?, ?)", email, nowIso()).run());
export const clearFailures = async (db: D1Database, email: string) =>
  void (await stmt(db, "DELETE FROM login_attempts WHERE email = ?", email).run());
