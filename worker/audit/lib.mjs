// Shared helpers for the audit scripts (local Worker only).
export const BASE = process.env.BASE ?? "http://localhost:8787";
export const PASS = "demo-password-2026";
export const iso = (days, hour = 10, len = 2) => {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + days); d.setUTCHours(hour, 0, 0, 0);
  return [d.toISOString(), new Date(+d + len * 36e5).toISOString()];
};
export const V = { main: "b0000000-0000-0000-0000-000000000001", sem: "b0000000-0000-0000-0000-000000000002", lab: "b0000000-0000-0000-0000-000000000003", oat: "b0000000-0000-0000-0000-000000000004", lib: "b0000000-0000-0000-0000-000000000005" };

export function client() {
  let cookie = "";
  const call = async (method, path, body, opts = {}) => {
    const t0 = performance.now();
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers: { ...(body !== undefined && !opts.raw ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...(opts.headers ?? {}) },
        body: body === undefined ? undefined : opts.raw ? body : JSON.stringify(body),
      });
    } catch (e) { return { status: 0, data: String(e.cause?.code ?? e.message), ms: performance.now() - t0 }; }
    const sc = res.headers.get("set-cookie");
    if (sc && sc.startsWith("session=") && !sc.startsWith("session=;")) cookie = sc.split(";")[0];
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, ms: performance.now() - t0, headers: res.headers, size: text.length };
  };
  call.cookie = () => cookie;
  call.clear = () => { cookie = ""; };
  return call;
}

export async function login(email, password = PASS) {
  const c = client();
  const r = await c("POST", "/api/auth/login", { email, password });
  c.loginResult = r;
  return c;
}

export const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : 0; };
export const summarize = (rs) => {
  const ms = rs.map((r) => r.ms), by = {};
  for (const r of rs) by[r.status] = (by[r.status] ?? 0) + 1;
  return { n: rs.length, statuses: by, p50: Math.round(pct(ms, 50)), p95: Math.round(pct(ms, 95)), p99: Math.round(pct(ms, 99)), max: Math.round(Math.max(...ms, 0)) };
};

/** Run fn over items with a concurrency cap. */
export async function pool(items, limit, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

/** coordinator creates a draft -> fills it -> allocates -> submits. Returns event id. */
export async function submitEvent(coord, { title, venue, start, end, capacity, allocs = [] }) {
  const d = await coord("POST", "/api/events/drafts", {});
  const id = d.data.id;
  const p = await coord("PATCH", `/api/events/${id}/draft`, { title, venue_id: venue, starts_at: start, ends_at: end, capacity });
  if (p.status !== 200) return { id, err: p };
  for (const [rid, q] of allocs) { const a = await coord("POST", `/api/events/${id}/allocations`, { resource_id: rid, quantity: q }); if (a.status !== 200) return { id, err: a }; }
  const s = await coord("POST", `/api/events/${id}/submit`);
  return { id, err: s.status === 200 ? null : s };
}
