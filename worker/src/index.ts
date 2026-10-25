// Cloudflare Worker entrypoint: the same REST API as the FastAPI backend (backend/app/routers/*),
// on D1. The Next.js app proxies /api/* here, so the session cookie stays first-party.

import {
  Actor, DomainError, Env, MSG, Row, STATUS, clearFailures, createSession, deleteSession, first,
  recentFailures, recordFailure, resolveSession, translate, ts, verifyPassword,
} from "./core";
import * as d from "./domain";

interface Ctx { req: Request; env: Env; db: D1Database; params: Record<string, string>; q: URLSearchParams; actor: Actor; body: () => Promise<Row> }
type Handler = (c: Ctx) => Promise<unknown> | unknown;

const COOKIE = "HttpOnly; SameSite=Lax; Path=/; Secure";
const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });
const bad = (msg?: string) => new DomainError("INVALID_INPUT", msg);

// ---- request parsing -----------------------------------------------------------------------------
const str = (b: Row, k: string, required = false): string | null => {
  const v = b[k];
  if (v == null || v === "") { if (required) throw bad(); return null; }
  if (typeof v !== "string") throw bad();
  return v;
};
const needTs = (q: URLSearchParams, k: string) => {
  const v = ts(q.get(k));
  if (!v) throw bad();
  return v;
};
const optTs = (q: URLSearchParams, k: string) => ts(q.get(k));

// ---- routes (first match wins, so specific paths come before /:id) -----------------------------------
const routes: { method: string; pattern: URLPattern; auth: boolean; fn: Handler }[] = [];
const route = (method: string, path: string, fn: Handler, auth = true) =>
  routes.push({ method, pattern: new URLPattern({ pathname: path }), auth, fn });

const sessionCookie = (token: string) => `session=${token}; Max-Age=604800; ${COOKIE}`;
const who = (p: Row) => ({ id: p.id, email: p.email, name: p.name, role: p.role });

function cookieToken(req: Request): string | null {
  const m = /(?:^|;\s*)session=([^;]+)/.exec(req.headers.get("cookie") ?? "");
  return m ? m[1] : null;
}

route("GET", "/api/health", () => ({ ok: true }), false);

route("POST", "/api/auth/login", async ({ env, db, body }) => {
  const b = await body();
  const email = (str(b, "email", true) as string).trim().toLowerCase(), password = str(b, "password", true) as string;
  const max = Number(env.LOGIN_MAX_FAILURES ?? 5), win = Number(env.LOGIN_WINDOW_MINUTES ?? 15);
  if ((await recentFailures(db, email, win)) >= max) {
    await recordFailure(db, email);
    return json({ code: "RATE_LIMITED", message: MSG.RATE_LIMITED }, 429);
  }
  const p = await first(db, "SELECT id, email, password_hash, name, role FROM profiles WHERE email = ?", email);
  if (!(await verifyPassword(password, p?.password_hash ?? null)) || !p) {
    await recordFailure(db, email);
    return json({ code: "UNAUTHENTICATED", message: MSG.UNAUTHENTICATED }, 401);
  }
  await clearFailures(db, email);
  return json(who(p), 200, { "set-cookie": sessionCookie(await createSession(db, p.id)) });
}, false);

route("POST", "/api/auth/logout", async ({ req, db }) => {
  const token = cookieToken(req);
  if (token) await deleteSession(db, token);
  return json({ ok: true }, 200, { "set-cookie": `session=; Max-Age=0; ${COOKIE}` });
}, false);

route("GET", "/api/auth/me", ({ actor }) => ({ id: actor.id, email: actor.email, name: actor.name, role: actor.role }));

route("POST", "/api/auth/demo-login", async ({ env, db, body }) => {
  if (env.DEMO_LOGIN !== "true") return json({ detail: "Demo login disabled" }, 404);
  const role = str(await body(), "role", true);
  if (!["coordinator", "student", "admin"].includes(role as string)) throw bad();
  const p = await first(db, "SELECT id, email, name, role FROM profiles WHERE role = ? AND email LIKE ? ORDER BY id LIMIT 1", role, "%@demo.college.test");
  if (!p) throw new DomainError("INTERNAL", `Demo account for role ${role} not found.`);
  return json(who(p), 200, { "set-cookie": sessionCookie(await createSession(db, p.id)) });
}, false);

// events
route("GET", "/api/events", ({ db, actor }) => d.listEventsWithSeats(db, actor));
route("GET", "/api/events/templates", ({ db, actor }) => d.listTemplates(db, actor));
route("POST", "/api/events/drafts", async ({ db, actor, body }) => ({ id: await d.createDraft(db, actor, str(await body(), "template_id")) }));
route("GET", "/api/events/:id", ({ db, actor, params }) => d.getEventDetail(db, actor, params.id));
route("PATCH", "/api/events/:id/draft", async ({ db, actor, params, body }) => (await d.saveDraft(db, actor, params.id, await body()), { id: params.id }));
route("PATCH", "/api/events/:id", async ({ db, actor, params, body }) => (await d.updateEvent(db, actor, params.id, await body()), { id: params.id }));
route("DELETE", "/api/events/:id/draft", async ({ db, actor, params }) => (await d.deleteDraft(db, actor, params.id), { ok: true }));
route("POST", "/api/events/:id/submit", async ({ db, actor, params }) => (await d.submitEvent(db, actor, params.id), { ok: true }));
route("POST", "/api/events/:id/cancel", async ({ db, actor, params, body }) => (await d.cancelEvent(db, actor, params.id, str(await body(), "reason")), { ok: true }));
route("POST", "/api/events/:id/advance", async ({ db, actor, params }) => ({ status: await d.advanceEvent(db, actor, params.id) }));
route("POST", "/api/events/:id/review", async ({ db, actor, params, body }) => {
  const b = await body();
  if (b.action !== "approve" && b.action !== "return") throw bad();
  await d.reviewEvent(db, actor, params.id, b.action === "approve", str(b, "reason"));
  return { status: b.action === "approve" ? "approved" : "returned" };
});
route("POST", "/api/events/:id/notify", async ({ db, actor, params, body }) => {
  const b = await body();
  return d.notifyRegistrants(db, actor, params.id, str(b, "kind", true) as string, str(b, "body", true) as string);
});

// registrations
route("POST", "/api/events/:id/register", async ({ db, actor, params }) => ({ status: await d.registerForEvent(db, actor, params.id) }));
route("DELETE", "/api/events/:id/register", async ({ db, actor, params }) => (await d.cancelRegistration(db, actor, params.id), { ok: true }));
route("GET", "/api/events/:id/seats", ({ db, actor, params }) => d.seatCounts(db, actor, params.id));
route("GET", "/api/registrations/mine", ({ db, actor }) => d.listMyRegistrations(db, actor));

// allocations
route("GET", "/api/events/:id/allocations", ({ db, actor, params }) => d.listAllocations(db, actor, params.id));
route("POST", "/api/events/:id/allocations", async ({ db, actor, params, body }) => {
  const b = await body();
  await d.setAllocation(db, actor, params.id, str(b, "resource_id", true) as string, b.quantity);
  return { ok: true };
});

// tasks and people
route("POST", "/api/events/:id/tasks", async ({ db, actor, params, body }) => {
  const b = await body();
  return { id: await d.createTask(db, actor, params.id, str(b, "title", true) as string, str(b, "assignee_id"), b.due_at) };
});
route("GET", "/api/events/:id/tasks", ({ db, actor, params }) => d.listEventTasks(db, actor, params.id));
route("GET", "/api/tasks/coordinator", ({ db, actor }) => d.listCoordinatorTasks(db, actor));
route("GET", "/api/tasks/mine", ({ db, actor }) => d.listMyTasks(db, actor));
route("PATCH", "/api/tasks/:id/status", async ({ db, actor, params, body }) =>
  (await d.setTaskStatus(db, actor, params.id, str(await body(), "label", true) as string), { ok: true }));
route("GET", "/api/people/students", ({ db, actor }) => d.listStudents(db, actor));
route("GET", "/api/people/me", ({ db, actor }) => d.myProfile(db, actor));

// notifications
route("GET", "/api/notifications", ({ db, actor }) => d.listNotifications(db, actor));
route("GET", "/api/notifications/unread-count", ({ db, actor }) => d.unreadCount(db, actor));
route("GET", "/api/notifications/alerts", ({ db, actor }) => d.computeAlerts(db, actor));
route("POST", "/api/notifications/:id/read", async ({ db, actor, params }) => (await d.markRead(db, actor, params.id), { ok: true }));

// admin calendar
route("GET", "/api/admin/bookings", ({ db, actor, q }) => d.listBookings(db, actor, needTs(q, "from_time"), needTs(q, "to_time")));

// venues
route("GET", "/api/venues", ({ db }) => d.listVenues(db));
route("GET", "/api/venues/free", ({ db, actor, q }) => d.freeVenues(db, actor, needTs(q, "start"), needTs(q, "end"), q.get("exclude_event_id")));
route("GET", "/api/venues/busy", ({ db, actor, q }) => d.busyVenues(db, actor, needTs(q, "start"), needTs(q, "end"), q.get("exclude_event_id")));
route("POST", "/api/venues", async ({ db, actor, body }) => ({ id: await d.saveVenue(db, actor, { ...(await body()), id: undefined }) }));
route("PUT", "/api/venues/:id", async ({ db, actor, params, body }) => ({ id: await d.saveVenue(db, actor, { ...(await body()), id: params.id }) }));

// resources
route("GET", "/api/resources", ({ db, actor, q }) => d.listResources(db, actor, optTs(q, "from_time"), optTs(q, "to_time")));
route("GET", "/api/resources/:id/available", ({ db, actor, params, q }) =>
  d.resourceAvailable(db, actor, params.id, needTs(q, "start"), needTs(q, "end"), q.get("exclude_event_id")));
route("POST", "/api/resources", async ({ db, actor, body }) => ({ id: await d.saveResource(db, actor, { ...(await body()), id: undefined }) }));
route("PUT", "/api/resources/:id", async ({ db, actor, params, body }) => ({ id: await d.saveResource(db, actor, { ...(await body()), id: params.id }) }));

// reports
const filters = (q: URLSearchParams) => ({ status: q.get("status"), from: q.get("from"), to: q.get("to") });
route("GET", "/api/reports", ({ db, actor, q }) => d.buildReport(db, actor, filters(q)));
route("GET", "/api/reports/export.csv", async ({ db, actor, q }) =>
  new Response(await d.exportCsv(db, actor, filters(q)), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="report.csv"' },
  }));

// ---- dispatch ---------------------------------------------------------------------------------------------
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.pattern.exec({ pathname: url.pathname });
        if (!m) continue;
        let actor: Actor | null = null;
        if (r.auth) {
          const token = cookieToken(req);
          actor = token ? await resolveSession(env.DB, token) : null;
          if (!actor) throw new DomainError("UNAUTHENTICATED");
        }
        let cached: Row | undefined;
        const body = async () => {
          if (cached) return cached;
          const text = await req.text();
          let v: unknown = {};
          try { v = text ? JSON.parse(text) : {}; } catch { throw bad(); }
          if (typeof v !== "object" || v === null || Array.isArray(v)) throw bad();
          return (cached = v as Row);
        };
        const out = await r.fn({ req, env, db: env.DB, params: m.pathname.groups as Record<string, string>, q: url.searchParams, actor: actor as Actor, body });
        return out instanceof Response ? out : json(out);
      }
      return json({ code: "NOT_FOUND", message: "That page does not exist." }, 404);
    } catch (e) {
      const err = translate(e);
      return json({ code: err.code, message: err.message }, STATUS[err.code] ?? 500);
    }
  },
} satisfies ExportedHandler<Env>;
