// Measure list endpoints after a year of history (3000 events, 60k registrations, 30k notifications for u0001).
import { login, summarize } from "./lib.mjs";

const student = await login("load1@load.test");   // u0001: owns the 30k notifications
const student2 = await login("load2@load.test");
const admin = await login("admin@demo.college.test");
const coord = await login("coordinator@demo.college.test");
const line = (k, v) => console.log(`${k.padEnd(40)} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const once = async (who, label, path) => { const r = await who("GET", path); line(label, `${r.status}  ${Math.round(r.ms)}ms  ${(r.size / 1024).toFixed(0)}KB`); };

console.log("== single request cost on aged data ==");
await once(student2, "student GET /api/events", "/api/events");
await once(student, "student(30k notifs) GET /api/notifications", "/api/notifications");
await once(student, "student(30k notifs) unread-count", "/api/notifications/unread-count");
await once(student2, "student GET /api/registrations/mine", "/api/registrations/mine");
await once(admin, "admin GET /api/events", "/api/events");
await once(admin, "admin GET /api/notifications/alerts", "/api/notifications/alerts");
await once(admin, "admin GET /api/reports", "/api/reports");
await once(coord, "coordinator GET /api/reports", "/api/reports");
await once(admin, "admin GET /api/people/students", "/api/people/students");
await once(coord, "coordinator GET /api/people/students", "/api/people/students");

console.log("\n== throughput, 20 concurrent clients, 8s each ==");
for (const [who, path, name] of [[student2, "/api/events", "student /api/events"], [student, "/api/notifications", "student /api/notifications (30k)"], [student, "/api/notifications/unread-count", "student unread-count (30k)"], [admin, "/api/notifications/alerts", "admin alerts"], [admin, "/api/reports", "admin reports"]]) {
  const end = performance.now() + 8000; const rs = [];
  await Promise.all(Array.from({ length: 20 }, async () => { while (performance.now() < end) rs.push(await who("GET", path)); }));
  const sm = summarize(rs);
  line(name, `${(rs.length / 8).toFixed(1)} req/s  p50=${sm.p50}ms p95=${sm.p95}ms  ${(rs[0].size / 1024).toFixed(0)}KB/resp`);
}
