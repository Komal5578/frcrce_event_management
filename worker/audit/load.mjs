// 1,000-user simulation against the LOCAL Worker. Usage: node load.mjs [phase ...]  (default: all)
// Phases: login browse race approve sat
import { V, client, iso, login, summarize, submitEvent } from "./lib.mjs";

const want = new Set(process.argv.slice(2));
const run = (p) => want.size === 0 || want.has(p);
const N = 1000;
const line = (k, v) => console.log(`${k.padEnd(34)} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const users = [];

console.log("\n== PHASE 1: login storm, 1000 users at the same instant ==");
const t0 = performance.now();
const rs0 = await Promise.all(Array.from({ length: N }, async (_, i) => {
  const c = client();
  const r = await c("POST", "/api/auth/login", { email: `load${i + 1}@load.test`, password: "demo-password-2026" });
  if (r.status === 200) users.push(c);
  return r;
}));
line("wall time (s)", ((performance.now() - t0) / 1000).toFixed(1));
line("login x1000", summarize(rs0));
const seq = []; for (let i = 0; i < 20; i++) seq.push(await client()("POST", "/api/auth/login", { email: `load${i + 1}@load.test`, password: "demo-password-2026" }));
line("login x20 sequential (idle)", summarize(seq));

const coord = await login("coordinator@demo.college.test");
const admin = await login("admin@demo.college.test");

if (run("browse")) {
  console.log("\n== PHASE 2: every user opens the app (6 calls each, all users concurrent) ==");
  const paths = ["/api/auth/me", "/api/events", "/api/registrations/mine", "/api/people/me", "/api/notifications/unread-count", "/api/notifications"];
  const t = performance.now();
  const all = await Promise.all(users.map(async (c) => { const out = []; for (const p of paths) out.push(await c("GET", p)); return out; }));
  line("wall time (s)", ((performance.now() - t) / 1000).toFixed(1));
  line("6000 page-load calls", summarize(all.flat()));
  for (const [i, p] of paths.entries()) line("  " + p, summarize(all.map((o) => o[i])));
}

if (run("race")) {
  console.log("\n== PHASE 3: 1000 students race for 100 seats, then 50 cancel at once ==");
  const [s, e] = iso(30, 10, 3);
  const ev = await submitEvent(coord, { title: "Launch Night", venue: V.oat, start: s, end: e, capacity: 100 });
  await admin("POST", `/api/events/${ev.id}/review`, { action: "approve" });
  await coord("POST", `/api/events/${ev.id}/advance`);
  const t = performance.now();
  const rs = await Promise.all(users.map((c) => c("POST", `/api/events/${ev.id}/register`)));
  line("wall time (s)", ((performance.now() - t) / 1000).toFixed(1));
  line("register x1000", summarize(rs));
  line("outcomes", rs.reduce((a, r) => { const k = r.data?.status ?? r.data?.code ?? r.status; a[k] = (a[k] ?? 0) + 1; return a; }, {}));
  const seats = (await coord("GET", `/api/events/${ev.id}/seats`)).data;
  line("DB truth (cap 100)", seats);
  line("OVERBOOKED?", seats.confirmed > seats.capacity ? "YES - BUG" : "no");
  const confirmedUsers = users.filter((_, i) => rs[i].data?.status === "confirmed").slice(0, 50);
  const cs = await Promise.all(confirmedUsers.map((c) => c("DELETE", `/api/events/${ev.id}/register`)));
  line("50 concurrent cancels", summarize(cs));
  line("after cancels (want 100/850)", (await coord("GET", `/api/events/${ev.id}/seats`)).data);
  const pos = (await Promise.all(users.map(async (c, i) => rs[i].data?.status === "waitlisted" ? (await c("GET", "/api/registrations/mine")).data.find((x) => x.event_id === ev.id) : null)))
    .filter((r) => r && r.reg_status === "waitlisted").map((r) => r.waitlist_pos).sort((a, b) => a - b);
  line("waitlist positions dense 1..n?", pos.every((p, i) => p === i + 1) ? `yes (${pos.length})` : "NO (ties/gaps)");
}

if (run("approve")) {
  console.log("\n== PHASE 4: 20 coordinators request the SAME venue+slot; admin approves all 20 concurrently ==");
  const [s, e] = iso(60, 10, 3);
  const cs = await Promise.all(Array.from({ length: 20 }, (_, i) => login(`coord${i + 1}@load.test`)));
  const subs = await Promise.all(cs.map((c, i) => submitEvent(c, { title: `Rival ${i + 1}`, venue: V.main, start: s, end: e, capacity: 100, allocs: [["c0000000-0000-0000-0000-000000000001", 3]] })));
  line("submitted (pending may overlap)", subs.filter((x) => !x.err).length);
  const rs = await Promise.all(subs.map((x) => admin("POST", `/api/events/${x.id}/review`, { action: "approve" })));
  line("approve outcomes", rs.reduce((a, r) => { const k = r.data?.code ?? r.status; a[k] = (a[k] ?? 0) + 1; return a; }, {}));
  const held = (await admin("GET", `/api/admin/bookings?from_time=${encodeURIComponent(s)}&to_time=${encodeURIComponent(e)}`)).data.filter((b) => b.venue_id === V.main && ["approved", "open", "ongoing"].includes(b.status));
  line("held bookings in slot (want 1)", held.length);
}

if (run("sat")) {
  console.log("\n== PHASE 5: saturation - closed loop, 10s per endpoint (local sqlite, no network RTT: an UPPER bound) ==");
  const targets = [
    ["student", "/api/notifications/unread-count"], ["student", "/api/events"], ["student", "/api/registrations/mine"],
    ["student", "/api/notifications"], ["admin", "/api/notifications/alerts"], ["coord", "/api/notifications/alerts"], ["admin", "/api/reports"],
  ];
  for (const conc of [20, 100]) for (const [who, path] of targets) {
    const pick = (i) => (who === "student" ? users[i % users.length] : who === "admin" ? admin : coord);
    const end = performance.now() + 10000; const rs = [];
    await Promise.all(Array.from({ length: conc }, async (_, i) => { while (performance.now() < end) rs.push(await pick(i)("GET", path)); }));
    const sm = summarize(rs);
    line(`${who} ${path} c=${conc}`, `${Math.round(rs.length / 10)} req/s  p50=${sm.p50}ms p95=${sm.p95}ms p99=${sm.p99}ms  ${JSON.stringify(sm.statuses)}  ${Math.round((rs[0].size ?? 0) / 1024)}KB/resp`);
  }
}
console.log("\ndone");
