// Usage: node smoke.mjs [baseUrl]   (default http://localhost:8787)
// One runnable check for the rules that must hold: auth, rate limit, authorization, double registration,
// waitlist promotion, the venue clash (reachable at admin approval) and the resource guard.
// Needs a freshly seeded database (the seed has the demo accounts and relative dates).
const BASE = process.argv[2] ?? "http://localhost:8787";
const PASS = "demo-password-2026";
const E = { keynote: "e0000000-0000-0000-0000-000000000004", openMic: "e0000000-0000-0000-0000-000000000005" };
const R = { projector: "c0000000-0000-0000-0000-000000000001" };
const V = { mainAuditorium: "b0000000-0000-0000-0000-000000000001" };

let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + extra}`); if (!ok) failed++; };

function client() {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get("set-cookie");
    if (sc) cookie = sc.split(";")[0];
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
  };
}
const login = async (email) => { const c = client(); const r = await c("POST", "/api/auth/login", { email, password: PASS }); return { c, r }; };

// --- auth ---
const { c: coord, r: r1 } = await login("coordinator@demo.college.test");
check("password login (PBKDF2 seed hash)", r1.status === 200 && r1.data.role === "coordinator", JSON.stringify(r1));
const stranger = client();
check("wrong password -> 401", (await stranger("POST", "/api/auth/login", { email: "karan@demo.college.test", password: "nope" })).status === 401);
check("no cookie -> 401", (await client()("GET", "/api/events")).status === 401);
let last;
for (let i = 0; i < 6; i++) last = await stranger("POST", "/api/auth/login", { email: "rate@demo.college.test", password: "x" });
check("sign-in rate limit -> 429", last.status === 429, String(last.status));

// --- authorization ---
const { c: asha } = await login("student@demo.college.test");
const { c: admin } = await login("admin@demo.college.test");
const from = encodeURIComponent(new Date(Date.now() - 864e5).toISOString()), to = encodeURIComponent(new Date(Date.now() + 40 * 864e5).toISOString());
check("student refused admin API (403)", (await asha("GET", `/api/admin/bookings?from_time=${from}&to_time=${to}`)).status === 403);
check("student refused coordinator API (403)", (await asha("POST", "/api/events/drafts", {})).status === 403);
check("admin sees bookings", (await admin("GET", `/api/admin/bookings?from_time=${from}&to_time=${to}`)).status === 200);

// --- registration: waitlist, double registration, promotion ---
const reg = await asha("POST", `/api/events/${E.openMic}/register`);
check("full event -> waitlisted", reg.status === 200 && reg.data.status === "waitlisted", JSON.stringify(reg));
const dup = await asha("POST", `/api/events/${E.openMic}/register`);
check("double registration -> 409 ALREADY_REGISTERED", dup.status === 409 && dup.data.code === "ALREADY_REGISTERED", JSON.stringify(dup));
const { c: karan } = await login("karan@demo.college.test");
check("confirmed attendee cancels", (await karan("DELETE", `/api/events/${E.openMic}/register`)).status === 200);
const { c: dev } = await login("dev@demo.college.test");
const mine = (await dev("GET", "/api/registrations/mine")).data;
check("oldest waitlisted (Dev) promoted to confirmed", mine.find((x) => x.event_id === E.openMic)?.reg_status === "confirmed", JSON.stringify(mine));
check("promotion notified", (await dev("GET", "/api/notifications")).data.some((n) => n.kind === "waitlist_promoted"));

// --- clash is reachable at approval (pending may overlap), and resources are re-checked ---
const key = (await coord("GET", `/api/events/${E.keynote}`)).data;
const draft = (await coord("POST", "/api/events/drafts", {})).data.id;
const patch = await coord("PATCH", `/api/events/${draft}/draft`, { title: "Clashing talk", venue_id: V.mainAuditorium, starts_at: key.starts_at, ends_at: key.ends_at, capacity: 50 });
check("draft saved", patch.status === 200, JSON.stringify(patch));
const alloc = await coord("POST", `/api/events/${draft}/allocations`, { resource_id: R.projector, quantity: 5 });
check("over-allocating a resource -> 409 RESOURCE_SHORT", alloc.status === 409 && alloc.data.code === "RESOURCE_SHORT", JSON.stringify(alloc));
check("fitting allocation accepted", (await coord("POST", `/api/events/${draft}/allocations`, { resource_id: R.projector, quantity: 3 })).status === 200);
check("submit overlapping request (pending may overlap)", (await coord("POST", `/api/events/${draft}/submit`)).status === 200);
const appr = await admin("POST", `/api/events/${draft}/review`, { action: "approve" });
check("approving the overlap -> 409 VENUE_CLASH", appr.status === 409 && appr.data.code === "VENUE_CLASH", JSON.stringify(appr));
const bk = (await admin("GET", `/api/admin/bookings?from_time=${from}&to_time=${to}`)).data;
check("admin calendar flags the overlap", bk.some((b) => b.event_id === draft && b.conflict), JSON.stringify(bk.map((b) => b.conflict)));
const ret = await admin("POST", `/api/events/${draft}/review`, { action: "return", reason: "Auditorium is taken" });
check("admin can return it with a reason", ret.status === 200 && ret.data.status === "returned", JSON.stringify(ret));
check("report + csv", (await coord("GET", "/api/reports")).data.totals?.events > 0);

console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
