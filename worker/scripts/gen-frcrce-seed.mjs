// Generates a Fr. CRCE demo seed: one coordinator account per council/club (names from frcrce.ac.in,
// the Forums + Project Groups pages and the Student Activities Rule Book 2026-27) and their events.
//
//   node scripts/gen-frcrce-seed.mjs
//     -> seed-frcrce.sql              hashed passwords only; apply to a FRESH database after the migrations
//     -> .credentials-frcrce.txt      plaintext passwords, gitignored, never commit
//
// Accounts are the organisations, not the named office-bearers (their names are public but they have not
// agreed to be accounts).
// Events: src "unstop" = real listing on Unstop (Crescendo 2026 fest page and GDG's own page, read 2026-10-25),
// with the real dates. Everything else keeps placeholder dates relative to load time (src named/generic/placeholder).
// Unstop does not publish capacities or most room numbers: capacities are estimates from the team limits it
// states, and rooms it does not name get a "(room TBA)" venue so the one-venue-one-slot rule still holds.
import { pbkdf2Sync, randomBytes, randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";

const DOMAIN = "frcrce-demo.test"; // .test is reserved: these can never be real mailboxes
const q = (s) => (s == null ? "NULL" : `'${String(s).replaceAll("'", "''")}'`);
const pad = (n, w = 12) => String(n).padStart(w, "0");
const ID = (p, n) => `${p}0000000-0000-0000-0000-${pad(n)}`;

// ---- passwords: random per account, same PBKDF2 format the Worker verifies ---------------------------
const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";
const password = () => Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => ALPHA[randomInt(ALPHA.length)]).join("")).join("-");
function hash(pw) {
  const salt = randomBytes(16);
  return `pbkdf2-sha256$100000$${salt.toString("base64")}$${pbkdf2Sync(pw, salt, 100000, 32, "sha256").toString("base64")}`;
}

// ---- generic venues / resources / templates (the college publishes none) ---------------------------------
const venues = [
  ["Main Auditorium", 400, "Main Block", 1], ["Seminar Hall A", 120, "Academic Block", 1], ["Seminar Hall B", 100, "Academic Block", 1],
  ["Lab 3", 40, "Computer Building", 1], ["Open Air Theatre", 600, "Campus Garden", 1], ["Library Conference Room", 30, "Library, Floor 2", 1],
  ["Sports Ground", 500, "Campus", 1], ["Main Gate", 150, "Meeting point for off-campus drives", 1], ["Old Gymkhana Hall", 80, "Closed for repair", 0],
];
const resources = [["Projector", 5], ["Microphones", 6], ["Chairs", 300], ["Extension boards", 10], ["Camera", 2], ["Banner stand", 4]];
const R = Object.fromEntries(resources.map((r, i) => [r[0], i + 1]));
const templates = [
  ["Workshop", "workshop", "Hands-on session with a small group and a facilitator.", 180, 40],
  ["Guest Lecture", "lecture", "Talk by an invited speaker, followed by questions.", 90, 120],
  ["Cultural Night", "cultural", "Evening performances open to the whole college.", 180, 400],
];

// ---- organisations (accounts) --------------------------------------------------------------------------------
const orgs = [
  ["sc-literary", "Student Council (Literary)", "Student Council"], ["sc-cultural", "Student Council (Cultural)", "Student Council"],
  ["sc-sports", "Student Council (Sports)", "Student Council"], ["sc-technical", "Student Council (Technical)", "Student Council"],
  ["abadha", "Team Abadha CRCE", "Technical team"], ["cfr", "Team CFR (CRCE Formula Racing)", "Technical team"], ["vayushastra", "Team Vayushastra", "Technical team"],
  ["robocon", "Team Robocon", "Technical team"], ["mavericks", "Team Mavericks", "Technical team"], ["project-cell", "Project Cell", "Technical team"],
  ["hawki", "HAWK-i CRCE", "Technical team"], ["robix", "Robix CRCE", "Technical team"], // Robix: named only in the Agnirakshak listing URL
  ["ieee", "IEEE CRCE", "Professional society"], ["asme", "ASME CRCE", "Professional society"], ["iiie", "IIIE-XCRCE", "Professional society"],
  ["acm", "ACM CRCE", "Professional society"], ["csi", "CSI CRCE", "Professional society"], ["wie", "WIE CRCE", "Professional society"],
  ["gdg", "GDG CRCE", "Technical club"], ["gda", "Game Developers Association", "Technical club"], ["codestorm", "CodeStorm", "Technical club"], ["mozilla", "Mozilla Campus CRCE", "Technical club"],
  ["tedx", "TEDxCRCE", "Student forum"], ["ecell", "eCell CRCE", "Student forum"], ["nss", "NSS CRCE", "Student forum"], ["rotaract", "Rotaract CRCE", "Student forum"],
].map(([slug, name, kind], i) => ({ slug, name, kind, n: i + 1 }));
const org = Object.fromEntries(orgs.map((o) => [o.slug, o]));

// ---- events ----------------------------------------------------------------------------------------------------
// when: [day, startHourIST, hours] relative to load ("sat" = next Saturday + 7), or ["YYYY-MM-DD HH:MM", "YYYY-MM-DD HH:MM"] IST (real).
// venue: generic venue name, or [name, location] for a venue made for this event (capacity = event capacity).
const DEMO = " Demo schedule: date and time are placeholders.";
const CRES = "Part of Crescendo 2026, the college's technical fest. Registration and details on Unstop.";
const TBA = (n) => [`${n} venue (room TBA)`, "Fr. CRCE campus; Unstop does not name the room"];
const E = [
  // ---- real, from Unstop (Crescendo 2026) ----
  { k: "ohm", org: "ieee", title: "Crescendo: OHM MY GOD!", type: "competition", cap: 60, venue: TBA("OHM MY GOD!"), when: ["2026-10-30 10:00", "2026-10-30 16:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/ohm-my-god-ieeexwie-crce-crescendo-fr-crce-students-council-1766636",
    desc: `Electronics challenge by IEEE x WIE CRCE in three timed phases: Decode (complete a circuit), Decide (pick components on a budget), Build. Teams of 3, Rs 150 per team, Rs 4,400 prize pool. ${CRES}` },
  { k: "funicorn", org: "ecell", title: "Crescendo: Formula Unicorn 2026", type: "competition", cap: 90, venue: TBA("Formula Unicorn"), when: ["2026-10-29 10:00", "2026-10-30 15:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/formula-unicorn-2026-e-cell-crce-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766688",
    desc: `eCell CRCE's live company auction: teams of 2-3 bid a virtual Rs 100 Crores, acquire companies, then pitch a business built from them. Rs 6,000 prize pool, up to 30 teams. ${CRES}` },
  { k: "agni", org: "robix", title: "Crescendo: Agnirakshak - Autonomous Fire Fighting Bot Challenge", type: "competition", cap: 48, venue: TBA("Agnirakshak"), when: ["2026-10-29 10:45", "2026-10-29 15:45"], status: "open", src: "unstop", url: "https://unstop.com/competitions/agnirakshak-autonomous-fire-extinguisher-bot-challenge-crescendo-robix-frcrce-1765973",
    desc: `Autonomous firefighting robots navigate an arena and put out four candle fires in the shortest time. Teams of 2-3, Rs 300 per team, 16 teams, top 8 reach the final round. ${CRES}` },
  { k: "glitched", org: "gda", title: "Crescendo: Glitched", type: "competition", cap: 60, venue: TBA("Glitched"), when: ["2026-10-29 10:00", "2026-10-30 13:00"], status: "open", src: "unstop", url: "https://unstop.com/hackathons/glitched-crescendo-gda-frcrce-1766721",
    desc: `Competitive debugging by the Game Developers Association: pseudo-code round (online), game debugging, then a final project with cascading bugs. Teams of up to 3, Rs 150 per team, Rs 3,000 prize pool. ${CRES}` },
  { k: "synergy", org: "sc-technical", title: "Crescendo: Synergy 2026", type: "competition", cap: 80, venue: TBA("Synergy 2026"), when: ["2026-11-01 09:00", "2026-11-01 20:00"], status: "open", src: "unstop", url: "https://unstop.com/hackathons/synergy-2026-crescendo-26-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767480",
    desc: `8-hour hardware simulation hackathon by the Students' Council. Teams of 2-4 are screened first; problem statements go out on 31 Oct. Rs 300 per team, Rs 40,000 prize pool. ${CRES}` },
  { k: "escape", org: "codestorm", title: "Crescendo: Escape Room", type: "competition", cap: 80, venue: ["Labs 601-604", "Fr. CRCE; final round runs in these labs"], when: ["2026-10-30 09:00", "2026-10-30 16:00"], status: "open", src: "unstop", url: "https://unstop.com/hackathons/escape-room-crescendo-codestorm-1766724",
    desc: `CodeStorm's coding challenge: a Vibe Coding round for FE/Diploma, and a DSA qualifier then the Escape Challenge for SE/TE/BE. 1-2 per team, Rs 100 per team, Rs 6,000 prize pool. ${CRES}` },
  { k: "doublecross", org: "csi", title: "Crescendo: The Double Cross (CSI-CRCE)", type: "competition", cap: 60, venue: TBA("The Double Cross"), when: ["2026-10-29 10:00", "2026-10-30 12:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/csi-crce-presents-the-double-cross-crescendo-fr-crce-students-council-1765055",
    desc: `Two rounds, one heist: Tech Monopoly, then Tech Detective: The Digital Heist. Teams of 1-2, Rs 100 per team. Unstop lists Round 1 at 10 PM, which looks like a typo; shown as 10 AM. ${CRES}` },
  { k: "pcell", org: "project-cell", title: "Crescendo: Hack Into PCell v2.0", type: "competition", cap: 60, venue: TBA("Hack Into PCell"), when: ["2026-10-29 09:00", "2026-10-30 13:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/hack-into-pcell-v20-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766733",
    desc: `Project Cell's multi-stage challenge: an ESP32 treasure hunt around campus, then SYSTEM//BREAK, a terminal-based incident-response round. Teams of 2-3, Rs 5,000 prize pool. ${CRES}` },
  { k: "robowars", org: "rotaract", title: "Crescendo: Robowars", type: "competition", cap: 80, venue: TBA("Robowars"), when: ["2026-10-30 10:00", "2026-10-30 18:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/robowars-crescendo-2026-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767051",
    desc: `8 kg combat robotics by Rotaract CRCE x STUCO CRCE: mandatory active weapon, three-minute matches, top eight compete for the title. Teams of 2-5, Rs 500 per team, Rs 60,000 prize pool. Start time not published; shown as 10:00. ${CRES}` },
  { k: "techneek", org: "asme", title: "Crescendo: Techनीक by ASME CRCE", type: "competition", cap: 60, venue: ["4th Floor (Techनीक arena)", "Fr. CRCE, 4th floor"], when: ["2026-10-29 09:00", "2026-10-30 13:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/technaka-by-asme-crce-crescendo-fr-crce-students-council-1766716",
    desc: `Two-day engineering showdown by ASME CRCE: technical quiz and Design Clash, the Marble Run Challenge, then a Bridge Under Pressure finale. Teams of 3, Rs 120 per team. ${CRES}` },
  { k: "aerocraft", org: "sc-technical", title: "Crescendo: AeroCraft - Design & Innovation Challenge", type: "competition", cap: 45, venue: TBA("AeroCraft"), when: ["2026-10-30 10:00", "2026-10-30 16:00"], status: "open", src: "unstop", url: "https://unstop.com/competitions/aerocraft-design-innovation-challenge-crescendo-fr-crce-students-council-1766715",
    desc: `Aerospace design challenge: design a virtual CanSat for a mission, then present it to judges (5 minutes plus Q&A). Teams of exactly 3, Rs 300 per team. ${CRES}` },
  { k: "sharktank", org: "acm", title: "Crescendo: Fr.CRCE Shark Tank 2026", type: "competition", cap: 68, venue: TBA("Shark Tank"), when: ["2026-10-30 09:00", "2026-10-30 16:30"], status: "ongoing", src: "unstop", url: "https://unstop.com/competitions/frcrce-shark-tank-2026-crescendo-frcrce-acm-student-chapter-1766671",
    desc: `Student entrepreneurship competition: 17 teams shortlisted from pitch-deck submissions give a 7-minute pitch, 6 minutes of Q&A and a mock investment negotiation. Teams of 2-4, Rs 149, Rs 60,000 prize pool. Registration is closed on Unstop. ${CRES}` },
  { k: "rumble", org: "sc-sports", title: "Crescendo: Royal Rumble (Clash Royale)", type: "esports", cap: 64, venue: ["Online (Clash Royale)", "Played online"], when: ["2026-10-29 10:00", "2026-10-29 17:00"], status: "open", src: "unstop", url: "https://unstop.com/events/royal-rumble-crescendo-2026-fr-crce-students-council-1772702",
    desc: `Online Clash Royale Mega Draft 1v1 tournament by the Students' Council: best-of-3 qualifiers, then a top-8 knockout. Individual, Rs 75 per participant. ${CRES}` },
  { k: "valorant", org: "sc-sports", title: "Crescendo: Valorant Vendetta", type: "esports", cap: 80, venue: TBA("Valorant Vendetta"), when: ["2026-10-30 10:00", "2026-10-31 18:00"], status: "open", src: "unstop", url: "https://unstop.com/events/valorant-vendetta-crescendo-2026-fr-crce-students-council-1772694",
    desc: `5v5 Valorant tournament by the Students' Council: online qualifiers on 30 Oct, on-campus main event on 31 Oct. Teams of 5, Rs 300 per team, Rs 10,000 prize pool. ${CRES}` },
  { k: "fc27", org: "sc-sports", title: "Crescendo: CRCE FC 27 Showdown", type: "esports", cap: 64, venue: TBA("CRCE FC 27"), when: ["2026-10-31 10:00", "2026-10-31 17:00"], status: "ongoing", src: "unstop", url: "https://unstop.com/events/crce-fc-27-showdown-crescendo-2026-fr-crce-students-council-1772704",
    desc: `FC football knockout by the Students' Council: pairs, 4 minutes per half, club picked by chit before each match. Rs 250. Registration is closed on Unstop. ${CRES}` },
  // ---- real, GDG's own listing ----
  { k: "wtaf", org: "gdg", title: "The World After the Fall", type: "competition", cap: 40, venue: ["Classrooms 809-810", "Fr. CRCE, Bandra"], when: ["2026-10-29 10:00", "2026-10-29 14:00"], status: "open", src: "unstop", url: "https://unstop.com/p/the-world-after-the-fall-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767452",
    desc: "Organised by Google Developer Groups on campus. Teams of two inherit survivors, four technologies and a secret mission, build a settlement for 100-200 people, bid for strategy cards and survive the Chaos Round. Rs 150 per team; prizes Rs 2,000 / 1,250 / 750 plus a best-FE-class award. Registration closes 28 Oct, 12:00. Start time not published; shown as 10:00." },
  // ---- named on frcrce.ac.in, placeholder dates ----
  { k: "crmd", org: "sc-literary", title: "Conceicao Rodrigues Memorial Debate (CRMD)", type: "competition", cap: 300, venue: "Main Auditorium", when: [12, 10, 4], status: "open", src: "named", desc: "National-level Oxford-style debate with 32 teams a year; the 27th edition ran in 2025." + DEMO },
  { k: "euphoria", org: "sc-cultural", title: "Euphoria: Battle of Beats", type: "cultural", cap: 500, venue: "Open Air Theatre", when: [20, 16, 4], status: "open", src: "named", desc: "Music face-off from Euphoria, the college's annual cultural fest." + DEMO },
  { k: "athlead", org: "sc-sports", title: "Athlead: Intra-college Sports Festival", type: "sports", cap: 300, venue: "Sports Ground", when: ["sat", 9, 6], status: "open", src: "named", desc: "The annual intra-college sports festival. Sports events run on weekends only." + DEMO },
  { k: "summercon", org: "hawki", title: "SummerCon CRCE", type: "lecture", cap: 300, venue: "Main Auditorium", when: [25, 9, 7], status: "open", src: "named", desc: "One-day cybersecurity conference by HAWK-i CRCE, with CTF challenges and industry speakers." + DEMO },
  { k: "bitnbuild", org: "gdg", title: "GDG CRCE: Bit-n-Build", type: "workshop", cap: 80, venue: "Seminar Hall A", when: [13, 10, 4], status: "open", src: "named", desc: "Bit-n-Build, a hands-on build session by GDG CRCE (Google Developer Groups on campus)." + DEMO },
  { k: "monster", org: "codestorm", title: "CodeStorm: Monster Hunt", type: "competition", cap: 150, venue: "Open Air Theatre", when: [14, 15, 3], status: "open", src: "named", desc: "Monster Hunt, a QR-code treasure hunt by CodeStorm, the coding and competitive programming council." + DEMO },
  { k: "tedx", org: "tedx", title: "TEDxCRCE", type: "lecture", cap: 350, venue: "Main Auditorium", when: [28, 13, 5], status: "open", src: "named", desc: "The college's independently run TEDx event, with speakers on social, technological and cultural topics." + DEMO },
  { k: "nss", org: "nss", title: "NSS CRCE: Beach Clean-up Drive", type: "service", cap: 80, venue: "Main Gate", when: [16, 7, 4], status: "open", src: "named", desc: "Beach clean-up drive by the National Service Scheme unit. Meet at the main gate." + DEMO },
  { k: "drugs", org: "rotaract", title: "Rotaract CRCE: Drug Awareness Seminar", type: "service", cap: 100, venue: "Seminar Hall A", when: [17, 11, 2], status: "open", src: "named", desc: "Drug awareness seminar by Rotaract CRCE, the club sponsored by the Rotary Club of Bombay Bandra." + DEMO },
  // ---- generic / placeholder ----
  { k: "abadha", org: "abadha", title: "Team Abadha: Meet the Electric ATV", type: "workshop", cap: 40, venue: "Lab 3", when: [6, 11, 2], status: "open", src: "generic", desc: "See the electric All Terrain Vehicle Team Abadha is building for the SAE E-BAJA competition." + DEMO },
  { k: "cfr", org: "cfr", title: "Team CFR: Open Garage", type: "workshop", cap: 100, venue: "Seminar Hall A", when: [22, 11, 3], status: "pending", src: "generic", desc: "Meet CRCE Formula Racing, the college's Formula SAE team." + DEMO },
  { k: "vayu", org: "vayushastra", title: "Team Vayushastra: Open Session", type: "workshop", cap: 40, venue: "Lab 3", when: [21, 11, 2], status: "approved", src: "placeholder", desc: "Open session with Team Vayushastra. Details to be announced." + DEMO },
  { k: "robocon", org: "robocon", title: "Team Robocon: Robot Demo Day", type: "workshop", cap: 90, venue: "Seminar Hall B", when: [7, 14, 2], status: "open", src: "generic", desc: "See the robots Team Robocon builds for ABU Robocon, the international robotics competition." + DEMO },
  { k: "mavericks", org: "mavericks", title: "Team Mavericks: Open Session", type: "workshop", cap: 60, venue: "Lab 3", when: [26, 10, 2], status: "returned", src: "placeholder", desc: "Open session with Team Mavericks. Details to be announced." + DEMO, ret: "Lab 3 only fits 40. Pick a bigger venue or lower the capacity." },
  { k: "pcell-ws", org: "project-cell", title: "Project Cell: Embedded Systems Workshop", type: "workshop", cap: 5, venue: "Lab 3", when: [18, 10, 3], status: "open", src: "generic", desc: "Hands-on embedded systems workshop where Project Cell members train juniors. Limited kits." + DEMO },
  { k: "iiie", org: "iiie", title: "IIIE-XCRCE: Industry Seminar", type: "lecture", cap: 90, venue: "Seminar Hall B", when: [10, 14, 2], status: "open", src: "generic", desc: "Industry seminar by IIIE-XCRCE, the Institution of Industrial Engineers student council." + DEMO },
  { k: "wie", org: "wie", title: "WIE CRCE: Women in Tech Talk", type: "lecture", cap: 80, venue: "Seminar Hall A", when: [22, 11, 2], status: "pending", src: "placeholder", desc: "Talk by WIE CRCE, the IEEE Women in Engineering affinity group. Details to be announced." + DEMO },
  { k: "mozilla", org: "mozilla", title: "Mozilla Campus CRCE: Open-Source Workshop", type: "workshop", cap: 30, venue: "Lab 3", when: [6, 11, 3], status: "pending", src: "generic", desc: "Workshop on open-source tools by Mozilla Campus CRCE. Booked for a slot Team Abadha holds (admin clash demo)." + DEMO },
];
const ev = Object.fromEntries(E.map((e) => [e.k, e]));
E.forEach((e, i) => (e.n = i + 1));

// venues: generic first, then one per event that names its own
const venueRows = [...venues];
const venueId = {}; venues.forEach((v, i) => (venueId[v[0]] = i + 1));
for (const e of E) if (Array.isArray(e.venue) && !venueId[e.venue[0]]) { venueRows.push([e.venue[0], e.cap, e.venue[1], 1]); venueId[e.venue[0]] = venueRows.length; }
const venueOf = (e) => venueId[Array.isArray(e.venue) ? e.venue[0] : e.venue];

// ---- times -------------------------------------------------------------------------------------------------------
const istToUtc = (s) => new Date(`${s.replace(" ", "T")}:00+05:30`).toISOString();
const base = (day) => (day === "sat" ? "'now','weekday 6','+7 days'" : `'now','+${day} days'`);
const relAt = (day, h, plusH = 0) => `strftime('%Y-%m-%dT%H:%M:%fZ',${base(day)},'start of day','+${h * 60 - 330 + plusH * 60} minutes')`;
const startOf = (e) => (typeof e.when[0] === "string" && e.when[0].includes("-") ? q(istToUtc(e.when[0])) : relAt(e.when[0], e.when[1]));
const endOf = (e) => (typeof e.when[0] === "string" && e.when[0].includes("-") ? q(istToUtc(e.when[1])) : relAt(e.when[0], e.when[1], e.when[2]));
const rel = (days, hours = 0) => `strftime('%Y-%m-%dT%H:%M:%fZ','now','${days >= 0 ? "+" : ""}${days} days','${hours >= 0 ? "+" : ""}${hours} hours')`;

// ---- people --------------------------------------------------------------------------------------------------------
const admin = { id: ID("a3", 1), email: `dean@${DOMAIN}`, name: "Dean's Office (Students' Welfare)", role: "admin", dept: "Administration", org: 0 };
// Departments are the ones listed on frcrce.ac.in. Student names are fictional.
const students = [
  ["asha", "Asha Patel", "Computer Engineering", 1], ["karan", "Karan Shah", "Mechanical Engineering", 0], ["meera", "Meera Iyer", "Electronics and Computer Science", 0],
  ["dev", "Dev Kulkarni", "Computer Science & Engineering", 1], ["zoya", "Zoya Khan", "Artificial Intelligence and Data Science", 0], ["rohan", "Rohan D'Souza", "Computer Engineering", 0],
].map(([k, name, dept, o], i) => ({ id: ID("a2", i + 1), email: `${k}@${DOMAIN}`, name, role: "student", dept, org: o, k }));
const sid = Object.fromEntries(students.map((s) => [s.k, s.id]));

const accounts = [
  { ...admin }, ...orgs.map((o) => ({ id: ID("a1", o.n), email: `${o.slug}@${DOMAIN}`, name: o.name, role: "coordinator", dept: null, org: 0 })), ...students,
].map((a) => ({ ...a, pw: password() }));

// ---- SQL -------------------------------------------------------------------------------------------------------------
const out = [];
const ins = (table, cols, rows) => rows.forEach((r) => out.push(`INSERT INTO ${table} (${cols}) VALUES (${r.join(", ")});`));
ins("profiles", "id, email, password_hash, name, role, department, is_organizer", accounts.map((a) => [q(a.id), q(a.email), q(hash(a.pw)), q(a.name), q(a.role), q(a.dept), a.org ?? 0]));
ins("venues", "id, name, capacity, location, active", venueRows.map((v, i) => [q(ID("b", i + 1)), q(v[0]), v[1], q(v[2]), v[3]]));
ins("resources", "id, name, quantity", resources.map((r, i) => [q(ID("c", i + 1)), q(r[0]), r[1]]));
ins("event_templates", "id, name, type, description, default_duration_minutes, default_capacity", templates.map((t, i) => [q(ID("d", i + 1)), q(t[0]), q(t[1]), q(t[2]), t[3], t[4]]));
ins("events", "id, title, type, description, coordinator_id, venue_id, starts_at, ends_at, capacity, status, return_reason",
  E.map((e) => [q(ID("e1", e.n)), q(e.title), q(e.type), q(e.desc), q(ID("a1", org[e.org].n)), q(ID("b", venueOf(e))), startOf(e), endOf(e), e.cap, q(e.status), q(e.ret ?? null)]));

const alloc = { crmd: [["Projector", 2], ["Microphones", 4], ["Chairs", 200]], euphoria: [["Microphones", 6], ["Extension boards", 6]], summercon: [["Projector", 2], ["Microphones", 4], ["Camera", 2]],
  tedx: [["Projector", 2], ["Microphones", 4], ["Camera", 1], ["Banner stand", 2]], monster: [["Extension boards", 4]], bitnbuild: [["Projector", 1], ["Extension boards", 3]], "pcell-ws": [["Extension boards", 5]] };
let a = 0;
ins("resource_allocations", "id, event_id, resource_id, quantity", Object.entries(alloc).flatMap(([k, list]) => list.map(([r, n]) => [q(ID("f", ++a)), q(ID("e1", ev[k].n)), q(ID("c", R[r])), n])));

// registrations only on open events. pcell-ws has 5 kits: 5 confirmed + 1 waitlisted shows the full/waitlist states.
const regs = [
  ["asha", "crmd", -5], ["asha", "tedx", -4], ["asha", "bitnbuild", -4], ["asha", "wtaf", -3], ["asha", "summercon", -3], ["asha", "euphoria", -2], ["asha", "pcell-ws", -3], ["asha", "doublecross", -1],
  ["karan", "abadha", -5], ["karan", "techneek", -4], ["karan", "tedx", -3], ["karan", "athlead", -3], ["karan", "euphoria", -2], ["karan", "pcell-ws", -2.5], ["karan", "robowars", -2],
  ["meera", "ohm", -4], ["meera", "doublecross", -4], ["meera", "euphoria", -3], ["meera", "nss", -2], ["meera", "funicorn", -3], ["meera", "pcell-ws", -1, "waitlisted"],
  ["dev", "bitnbuild", -5], ["dev", "monster", -4], ["dev", "crmd", -3], ["dev", "pcell-ws", -4], ["dev", "wtaf", -2], ["dev", "escape", -2], ["dev", "glitched", -2],
  ["zoya", "summercon", -4], ["zoya", "doublecross", -3], ["zoya", "funicorn", -2], ["zoya", "pcell-ws", -3.5], ["zoya", "aerocraft", -1], ["zoya", "ohm", -1],
  ["rohan", "monster", -4], ["rohan", "tedx", -3], ["rohan", "drugs", -2], ["rohan", "pcell-ws", -3.2], ["rohan", "valorant", -1], ["rohan", "glitched", -1],
];
for (const [, k] of regs) if (ev[k].status !== "open") throw new Error(`registration on non-open event ${k}`);
ins("registrations", "id, event_id, user_id, status, created_at", regs.map(([s, k, d, st], i) => [q(ID("10", i + 1)), q(ID("e1", ev[k].n)), q(sid[s]), q(st ?? "confirmed"), rel(Math.trunc(d), (d % 1) * 24)]));

const tasks = [
  ["tedx", "Confirm speaker line-up", "asha", 5, "doing"], ["tedx", "Print banners", "dev", 20, "todo"], ["crmd", "Collect team lists", "asha", -1, "todo"],
  ["crmd", "Book adjudicators", "dev", 4, "done"], ["summercon", "Open CTF registrations", "dev", 14, "todo"],
];
ins("tasks", "id, event_id, title, assignee_id, due_at, status, completed_at",
  tasks.map(([k, title, s, due, st], i) => [q(ID("20", i + 1)), q(ID("e1", ev[k].n)), q(title), q(sid[s]), rel(due), q(st), st === "done" ? rel(-1) : "NULL"]));

writeFileSync(new URL("../seed-frcrce.sql", import.meta.url), `-- Fr. CRCE demo seed (generated by scripts/gen-frcrce-seed.mjs). Hashed passwords only.\n-- Apply to a FRESH database after the migrations.\n${out.join("\n")}\n`);
writeFileSync(new URL("../.credentials-frcrce.txt", import.meta.url),
  `# Fr. CRCE demo logins. DO NOT COMMIT. Sign in at the normal email form.\n${accounts.map((x) => `${x.email}\t${x.pw}\t${x.role}\t${x.name}`).join("\n")}\n`, { mode: 0o600 });

console.log(`${accounts.length} accounts (${orgs.length} coordinators, ${students.length} students, 1 admin), ${E.length} events (${E.filter((e) => e.src === "unstop").length} from Unstop), ${regs.length} registrations, ${venueRows.length} venues`);
console.table(E.map((e) => ({ account: org[e.org].name, event: e.title.slice(0, 52), status: e.status, source: e.src })));
