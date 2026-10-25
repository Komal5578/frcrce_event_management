// Security / logic probes. Each prints one line: [HOLDS|BROKEN|NOTE] name -> evidence.
import { PASS, V, client, iso, login, submitEvent } from "./lib.mjs";

const out = [];
const rec = (verdict, name, ev) => { out.push({ verdict, name, ev }); console.log(`[${verdict}] ${name} -> ${typeof ev === "string" ? ev : JSON.stringify(ev)}`); };
const short = (r) => `${r.status} ${r.data?.code ?? (typeof r.data === "string" ? r.data.slice(0, 60) : "")}`;
const tally = (rs) => JSON.stringify(rs.reduce((a, x) => ((a[x.status] = (a[x.status] ?? 0) + 1), a), {}));

const coord1 = await login("coordinator@demo.college.test");
const coord2 = await login("coordinator2@demo.college.test");
const admin = await login("admin@demo.college.test");
const asha = await login("student@demo.college.test");
const karan = await login("karan@demo.college.test");
const L = (i) => login(`load${i}@load.test`);
const EV = { draft: "e0000000-0000-0000-0000-000000000001", pending: "e0000000-0000-0000-0000-000000000002", approved: "e0000000-0000-0000-0000-000000000003", open: "e0000000-0000-0000-0000-000000000004", completed: "e0000000-0000-0000-0000-000000000007" };

// ---------- authorization / IDOR ----------
let r = await coord2("PATCH", `/api/events/${EV.approved}`, { title: "hijack" });
rec(r.status === 403 ? "HOLDS" : "BROKEN", "coordinator B cannot edit coordinator A's event", short(r));
r = await asha("GET", `/api/events/${EV.draft}`);
rec(r.status === 403 ? "HOLDS" : "BROKEN", "student cannot read another coordinator's draft", short(r));
r = await asha("POST", `/api/events/${EV.open}/notify`, { kind: "x", body: "spam" });
rec(r.status === 403 ? "HOLDS" : "BROKEN", "student cannot notify registrants", short(r));
r = await asha("GET", "/api/people/students");
rec(r.status === 403 ? "HOLDS" : "BROKEN", "student cannot list all students", short(r));
r = await coord1("POST", `/api/events/${EV.pending}/review`, { action: "approve" });
rec(r.status === 403 ? "HOLDS" : "BROKEN", "coordinator cannot approve", short(r));
r = await coord1("POST", "/api/venues", { name: "x", capacity: 5 });
rec(r.status === 403 ? "HOLDS" : "BROKEN", "coordinator cannot create venue", short(r));
r = await karan("POST", `/api/notifications/30000000-0000-0000-0000-000000000001/read`);
rec(r.status === 403 ? "HOLDS" : "BROKEN", "student cannot mark another user's notification read", short(r));
r = await coord1("POST", `/api/events/${EV.open}/tasks`, { title: "assign to admin", assignee_id: "a0000000-0000-0000-0000-000000000003" });
rec(r.status === 200 ? "BROKEN" : "HOLDS", "task assignee must be a student", short(r));
r = await coord1("POST", `/api/events/${EV.open}/tasks`, { title: "ghost", assignee_id: "not-a-user" });
rec("NOTE", "task for nonexistent assignee", short(r));

// ---------- input validation ----------
let d = (await coord1("POST", "/api/events/drafts", {})).data.id;
const bodies = { venue_id_object: { venue_id: { a: 1 } }, type_array: { type: [] }, desc_object: { description: {} }, title_number: { title: 12345 }, capacity_string: { capacity: "50" }, capacity_float: { capacity: 2.5 } };
for (const [k, b] of Object.entries(bodies)) { r = await coord1("PATCH", `/api/events/${d}/draft`, b); rec(r.status >= 500 ? "BROKEN" : "HOLDS", `type confusion ${k}`, short(r)); }
const big = "A".repeat(2_000_000);
r = await coord1("PATCH", `/api/events/${d}/draft`, { title: "big", description: big });
rec(r.status === 200 ? "BROKEN" : "HOLDS", "2 MB description accepted (no length cap)", short(r));
r = await coord1("PATCH", `/api/events/${d}/draft`, { title: "x".repeat(121) });
rec(r.status === 422 ? "HOLDS" : "BROKEN", "title >120 rejected", short(r));
r = await client()("POST", "/api/auth/login", "{not json", { raw: true });
rec(r.status < 500 ? "HOLDS" : "BROKEN", "malformed JSON -> 4xx", short(r));
r = await client()("POST", "/api/auth/login", { email: "' OR 1=1--", password: "x" });
rec(r.status === 401 ? "HOLDS" : "BROKEN", "SQL injection in login", short(r));
r = await coord1("PATCH", `/api/events/${d}/draft`, { title: "=HYPERLINK(\"http://evil\",\"x\")" });
const csv = await coord1("GET", "/api/reports/export.csv");
rec(typeof csv.data === "string" && csv.data.includes("'=HYPERLINK") ? "HOLDS" : "BROKEN", "CSV formula injection neutralised", short(csv));

// ---------- business rules ----------
// 1. capacity larger than the venue
const [s1, e1] = iso(401, 10, 2);
let ev = await submitEvent(coord1, { title: "Oversized crowd", venue: V.lib, start: s1, end: e1, capacity: 5000 });
let ap = await admin("POST", `/api/events/${ev.id}/review`, { action: "approve" });
rec(ap.status === 200 ? "BROKEN" : "HOLDS", "capacity 5000 in a 30-seat room can be approved", `submit ${ev.err ? short(ev.err) : "200"}, approve ${short(ap)}`);
// 2. event in the past
const past = [new Date(Date.now() - 30 * 864e5).toISOString(), new Date(Date.now() - 30 * 864e5 + 36e5).toISOString()];
ev = await submitEvent(coord1, { title: "Event in the past", venue: V.sem, start: past[0], end: past[1], capacity: 10 });
ap = await admin("POST", `/api/events/${ev.id}/review`, { action: "approve" });
const adv = await coord1("POST", `/api/events/${ev.id}/advance`);
const reg = await asha("POST", `/api/events/${ev.id}/register`);
rec(reg.status === 200 ? "BROKEN" : "HOLDS", "past-dated event can be created, approved, opened and registered for", `submit ${ev.err ? short(ev.err) : 200}, approve ${ap.status}, open ${adv.status}, register ${reg.status}`);
// 3. cancel registration after the event completed
r = await asha("DELETE", `/api/events/${EV.completed}/register`);
rec(r.status === 200 ? "BROKEN" : "HOLDS", "student can cancel registration on a COMPLETED event", short(r));
// 4. coordinator edits an approved/open event without admin re-review
const [s2, e2] = iso(402, 10, 2);
r = await coord1("PATCH", `/api/events/${EV.open}`, { venue_id: V.sem, starts_at: s2, ends_at: e2, capacity: 400 });
rec(r.status === 200 ? "BROKEN" : "HOLDS", "coordinator moves an OPEN event to a new venue/date with no admin re-approval", short(r));
// 5. admin lowers resource stock below concurrent reservations
const rq = await admin("POST", "/api/resources", { name: "Audit Rig", quantity: 10 });
const [s3, e3] = iso(403, 10, 2);
const a1 = await submitEvent(coord1, { title: "Rig A", venue: V.main, start: s3, end: e3, capacity: 10, allocs: [[rq.data.id, 5]] });
const a2 = await submitEvent(coord2, { title: "Rig B", venue: V.oat, start: s3, end: e3, capacity: 10, allocs: [[rq.data.id, 5]] });
await admin("POST", `/api/events/${a1.id}/review`, { action: "approve" });
await admin("POST", `/api/events/${a2.id}/review`, { action: "approve" });
r = await admin("PUT", `/api/resources/${rq.data.id}`, { name: "Audit Rig", quantity: 5 });
rec(r.status === 200 ? "BROKEN" : "HOLDS", "admin cuts stock 10 -> 5 while 5+5 are reserved at the same time (over-allocation)", short(r));
// 6. admin lowers venue capacity below a held event
r = await admin("PUT", `/api/venues/${V.main}`, { name: "Main Auditorium", capacity: 5, location: "Main Block", active: true });
rec(r.status === 200 ? "BROKEN" : "HOLDS", "admin cuts venue capacity to 5 under a 400-seat event", short(r));
// 7. waitlist queue-jump after capacity increase
const [s4, e4] = iso(404, 10, 2);
const w = await submitEvent(coord1, { title: "Waitlist fairness", venue: V.lab, start: s4, end: e4, capacity: 1 });
await admin("POST", `/api/events/${w.id}/review`, { action: "approve" }); await coord1("POST", `/api/events/${w.id}/advance`);
const [u1, u2, u3] = await Promise.all([L(1), L(2), L(3)]);
const ra = await u1("POST", `/api/events/${w.id}/register`); const rb = await u2("POST", `/api/events/${w.id}/register`);
await coord1("PATCH", `/api/events/${w.id}`, { capacity: 2 });
const rc = await u3("POST", `/api/events/${w.id}/register`);
const mine = (await u2("GET", "/api/registrations/mine")).data.find((x) => x.event_id === w.id);
rec(rc.data.status === "confirmed" && mine.reg_status === "waitlisted" ? "BROKEN" : "HOLDS", "capacity raised 1->2: waitlisted user B stays queued while late user C jumps ahead", `A=${ra.data.status} B=${rb.data.status}->${mine.reg_status} C=${rc.data.status}`);
// 8. double submit
const [s6, e6] = iso(405, 10, 2);
const dbl = await submitEvent(coord1, { title: "Double submit", venue: V.main, start: s6, end: e6, capacity: 50 });
await admin("POST", `/api/events/${dbl.id}/review`, { action: "approve" }); await coord1("POST", `/api/events/${dbl.id}/advance`);
const u4 = await L(4);
const burst = await Promise.all(Array.from({ length: 25 }, () => u4("POST", `/api/events/${dbl.id}/register`)));
rec(burst.filter((x) => x.status === 200).length === 1 ? "HOLDS" : "BROKEN", "25 concurrent registers by one user", tally(burst));
// 9. reschedule trigger: move open event onto another held event's slot
r = await coord1("PATCH", `/api/events/${dbl.id}`, { venue_id: V.lab, starts_at: s4, ends_at: e4 });
rec(r.status === 409 ? "HOLDS" : "BROKEN", "rescheduling onto a taken slot is refused by the DB trigger", short(r));

// ---------- web / session ----------
const sc = (await client()("POST", "/api/auth/login", { email: "load5@load.test", password: PASS })).headers.get("set-cookie");
rec(/HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Lax/.test(sc) ? "HOLDS" : "BROKEN", "session cookie flags", sc.replace(/session=[^;]+/, "session=<token>"));
const u6 = await L(6);
const tok = u6.cookie();
await u6("POST", "/api/auth/logout");
const re = await fetch("http://localhost:8787/api/auth/me", { headers: { cookie: tok } });
rec(re.status === 401 ? "HOLDS" : "BROKEN", "token dead after logout", re.status);
const csrf = await u4("POST", `/api/events/${dbl.id}/register`, "{}", { raw: true, headers: { "content-type": "text/plain", origin: "https://evil.example", "sec-fetch-site": "cross-site" } });
rec("NOTE", "cross-site Origin + text/plain accepted by Worker (only SameSite=Lax stands in the way)", short(csrf));
const h = await client()("GET", "/api/health");
rec("NOTE", "response security headers on API", Object.fromEntries(["x-content-type-options", "cache-control", "strict-transport-security", "content-security-policy"].map((k) => [k, h.headers.get(k)])));
const nf = await client()("GET", "/api/nope");
rec("NOTE", "unknown route", short(nf));

// ---------- auth abuse ----------
const victim = "karan@demo.college.test";
const atk = client();
const res = [];
for (let i = 0; i < 8; i++) res.push((await atk("POST", "/api/auth/login", { email: victim, password: "wrong" + i })).status);
const legit = await client()("POST", "/api/auth/login", { email: victim, password: PASS });
rec(legit.status === 429 ? "BROKEN" : "HOLDS", "attacker with 8 bad guesses locks the real owner out (account-lockout DoS)", `attempts ${res.join(",")}, then real password -> ${legit.status}`);
const spray = await Promise.all(Array.from({ length: 300 }, (_, i) => client()("POST", "/api/auth/login", { email: `load${100 + i}@load.test`, password: "Password123" })));
rec(spray.some((x) => x.status === 429) ? "HOLDS" : "BROKEN", "password spray: one guess against 300 different accounts, no throttle", tally(spray));
const junk = await Promise.all(Array.from({ length: 500 }, (_, i) => client()("POST", "/api/auth/login", { email: `junk${i}-${Date.now()}@nowhere.test`, password: "x" })));
rec("NOTE", "500 unknown-email logins each wrote a permanent login_attempts row (never purged)", tally(junk));

console.log("\nSUMMARY", JSON.stringify(out.reduce((a, x) => ((a[x.verdict] = (a[x.verdict] ?? 0) + 1), a), {})));
