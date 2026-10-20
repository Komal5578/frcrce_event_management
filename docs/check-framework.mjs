// Run from repo root: node docs/check-framework.mjs [--wave N]   (default 4 = everything)
// Phase 2 consistency check. A check in wave W runs only when W <= N.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const wi = process.argv.indexOf('--wave');
const WAVE = wi > -1 ? Number(process.argv[wi + 1]) : 4;
const errors = [];
const warns = [];
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : (errors.push(`${p}: file missing`), ''));
const err = (p, m) => errors.push(`${p}: ${m}`);
const section = (txt, re) => { // text of a "## " section whose heading matches re, up to next "## "
  const parts = txt.split(/^(?=## )/m);
  return parts.find((s) => re.test(s.split('\n')[0])) ?? null;
};
const files = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => `${dir}/${f}`) : []);

const IDS = [...'1234567'].map((n) => 'C' + n)
  .concat([...'12345'].map((n) => 'S' + n), [...'12345'].map((n) => 'A' + n), [...'12345'].map((n) => 'X' + n));
const idTok = new RegExp(`\\b(${IDS.join('|')})\\b`);
const STATUS = ['Draft', 'Pending approval', 'Approved', 'Open', 'Full', 'Waitlist', 'Waitlisted', 'Registered', 'Ongoing',
  'Completed', 'Cancelled', 'Returned', 'To do', 'In progress', 'Done', 'Overdue', 'Clash', 'Low registrations'];
const ROLES = { coordinator: 'CO', student: 'ST', admin: 'AD' };

// ---------- WAVE 1 ----------
if (WAVE >= 1) {
  const rp = 'kb/domain/requirements.md';
  const req = read(rp);
  for (const id of IDS) {
    const l = req.split('\n').find((x) => x.startsWith(`- ${id} `));
    if (!l) err(rp, `no line for ${id}`);
    else if (!l.includes('Accept:') || !/Priority: (must|should)/.test(l)) err(rp, `${id} needs "Accept:" and "Priority: must|should"`);
  }

  const gp = 'kb/domain/goals-tasks.md';
  const g = read(gp);
  if (!g.includes('Organizer')) err(gp, 'must mention Organizer');
  const cov = section(g, /^## Coverage/);
  if (!cov) err(gp, 'no "## Coverage" section');
  for (const id of IDS) {
    if (!new RegExp(`\\b${id}\\b`).test(g)) err(gp, `${id} does not appear`);
    else if (cov && !new RegExp(`\\b${id}\\b`).test(cov)) err(gp, `${id} missing from Coverage`);
  }
  for (const r of ['Coordinator', 'Student', 'Admin']) {
    const s = section(g, new RegExp(`^## ${r}\\b`));
    if (!s) { err(gp, `no "## ${r}" section`); continue; }
    for (const row of s.split('\n').filter((x) => x.startsWith('|') && !/^\|[\s:|-]+$/.test(x) && !/^\|\s*Goal\s*\|/.test(x)))
      if (!idTok.test(row)) err(gp, `orphan task row in ${r}: ${row.slice(0, 60)}`);
  }

  const sp = 'kb/domain/scenarios.md';
  const sc = read(sp);
  for (const t of ['TT-C1', 'TT-S1', 'TT-A1']) {
    const m = sc.match(new RegExp(`^### ${t}\\b[\\s\\S]*?(?=^#{2,3} |(?![\\s\\S]))`, 'm'));
    if (!m) { err(sp, `no "### ${t}" heading`); continue; }
    for (const k of ['- Start state:', '- Goal (plain words):', '- Success:', '- Max time:'])
      if (!m[0].includes(k)) err(sp, `${t} lacks "${k}"`);
  }
  for (const k of ['Coordinator', 'Student', 'Admin'])
    if (!sc.split('\n').some((l) => l.startsWith(`**${k} edge`))) err(sp, `no "**${k} edge" scenario`);
  for (const l of sc.split('\n'))
    if (l.startsWith('- Goal') && /\b(button|tab|filter|menu|click|icon|dropdown)\b/i.test(l)) err(sp, `UI noun in goal (D-05): ${l}`);
}

// ---------- WAVE 2 ----------
if (WAVE >= 2) {
  for (const [r, px] of Object.entries(ROLES)) {
    const p = `docs/ia/${r}.md`;
    const t = read(p);
    if (!t) continue;
    if (!t.includes('```mermaid')) err(p, 'no mermaid block');
    const nav = section(t, /^## Navigation/);
    if (!nav) err(p, 'no "## Navigation" section');
    else {
      const n = nav.split('\n').filter((x) => x.startsWith('|') && !/^\|[\s:|-]+$/.test(x)).length - 1; // minus header
      if (n < 1 || n > 5) err(p, `Navigation has ${n} items, want 1..5`);
    }
    const scr = section(t, /^## Screens/);
    if (!scr) err(p, 'no "## Screens" section');
    else if (!new RegExp(`\\b${px}-\\d{2}\\b`).test(scr)) err(p, `no ${px}-NN screen ids`);
    if (r === 'student' && !(t.includes('My Tasks') && /organizer/i.test(t))) err(p, 'needs "My Tasks" and organizer');
    if (r === 'admin') {
      if (!(scr ?? '').includes('AD-01')) err(p, 'Screens must list AD-01');
      if (!t.includes('Admin home') || !t.includes('not a nav item')) err(p, 'needs "Admin home" and "not a nav item"');
    }
  }
  const vp = 'docs/ia/shared-vocabulary.md';
  const v = read(vp);
  if (v) {
    if (!v.includes('X4')) err(vp, 'must cite X4');
    if (!v.includes('Review & Confirm')) err(vp, 'must contain "Review & Confirm"');
    for (const s of STATUS) if (!v.includes(s)) err(vp, `missing status word "${s}"`);
  }
}

// ---------- WAVE 3 ----------
const irScreens = (r) => { // screen ids from IA Screens section
  const t = existsSync(`docs/ia/${r}.md`) ? readFileSync(`docs/ia/${r}.md`, 'utf8') : '';
  const s = section(t, /^## Screens/) ?? '';
  return [...new Set(s.match(new RegExp(`\\b${ROLES[r]}-\\d{2}\\b`, 'g')) ?? [])];
};
if (WAVE >= 3) {
  const FL = {
    'coordinator-create-event': ['DO: cancel', 'DO: submit'],
    'student-register': ['DO: register', 'DO: cancel'],
    'admin-approve': ['DO: approve', 'DO: return'],
    'organizer-mark-task-done': [],
  };
  for (const [name, need] of Object.entries(FL)) {
    const p = `docs/flows/${name}.md`;
    const t = read(p);
    if (!t) continue;
    if (!t.includes('```mermaid')) err(p, 'no mermaid block');
    for (const m of t.matchAll(/\b(\w+)\["DO:/g))
      if (!new RegExp(`RC\\w*\\s*-->(\\|[^|]*\\|)?\\s*${m[1]}\\b`).test(t)) err(p, `irreversible node ${m[1]} not preceded by an RC node`);
    for (const k of need) if (!t.includes(k)) err(p, `missing "${k}"`);
    if (name === 'organizer-mark-task-done') { if (!t.includes('Undo')) err(p, 'must contain "Undo"'); }
    else {
      if (!/\bRC\w*\["[^"]*Review & Confirm/.test(t) && !/\bRC\w*\[[^\]]*Review & Confirm/.test(t)) err(p, 'no Review & Confirm label on an RC node');
      if (!t.includes('Prefill:')) err(p, 'no Prefill: node');
      if (!/ERR:[^\n]*"/.test(t)) err(p, 'no ERR: node with a quoted human message');
    }
    for (const id of new Set(t.match(/\b(CO|ST|AD)-\d{2}\b/g) ?? [])) {
      const r = Object.keys(ROLES).find((k) => ROLES[k] === id.slice(0, 2));
      if (!irScreens(r).includes(id)) err(p, `screen ${id} not in docs/ia/${r}.md`);
    }
  }

  for (const r of Object.keys(ROLES)) {
    const p = `docs/wireframes/${r}.md`;
    const t = read(p);
    if (!t) continue;
    const ids = irScreens(r);
    for (const id of ids) {
      const s = t.match(new RegExp(`^## ${id}\\b[\\s\\S]*?(?=^## |(?![\\s\\S]))`, 'm'));
      if (!s) { err(p, `no "## ${id}" wireframe`); continue; }
      const sec = s[0];
      if (!idTok.test(sec.split('\n')[0])) err(p, `${id} heading has no requirement id`);
      const next = sec.split('\n').find((l) => l.startsWith('Next:'));
      if (!next) err(p, `${id} has no "Next:" line`);
      else if (!/Next:\s*end\b/.test(next))
        for (const n of next.match(/\b(CO|ST|AD)-\d{2}\b/g) ?? []) if (!ids.includes(n)) err(p, `${id} Next: names unknown ${n}`);
      if (id.endsWith('-01'))
        for (const k of ['A-', 'A+', 'Empty:', 'Error:']) if (!sec.includes(k)) err(p, `${id} lacks "${k}"`);
    }
  }
  for (const p of files('docs/wireframes')) {
    const t = readFileSync(p, 'utf8');
    if (/#[0-9a-fA-F]{6}\b/.test(t)) err(p, 'hex colour found (greyscale only)');
    const st = STATUS.join('|');
    for (const m of t.matchAll(/\[([^\]\n]*)\]/g)) {
      const body = m[1];
      const hasStatus = new RegExp(`\\b(${st})\\b`).test(body);
      if (new RegExp(`^(${st})( - [a-z]+)?$`).test(body)) err(p, `status chip without icon: ${m[0]}`);
      else if (/^[^\p{L}\p{N}\s] /u.test(body) && hasStatus && !new RegExp(`^\\S+ (${st}) - [a-z]+$`).test(body)) err(p, `malformed status chip: ${m[0]}`);
    }
  }
}

// ---------- WAVE 4 ----------
if (WAVE >= 4) {
  const fl = read('kb/domain/flows.md');
  for (const n of ['coordinator-create-event', 'student-register', 'admin-approve', 'organizer-mark-task-done'])
    if (!fl.includes(n)) err('kb/domain/flows.md', `does not reference ${n}`);
  const kb = ['requirements', 'goals-tasks', 'scenarios', 'flows'].map((f) => `kb/domain/${f}.md`);
  for (const p of [...kb, ...files('docs/ia'), ...files('docs/flows'), ...files('docs/wireframes')]) {
    const t = read(p);
    if (/^confidence: (evidence|source)$/m.test(t)) err(p, 'confidence must not be evidence/source');
    if (!kb.includes(p) && !/derived/.test(t)) err(p, 'needs the visible word "derived"');
    if (!kb.includes(p))
      t.split('\n').forEach((l, i) => { if (/\b(sms|qr|payment|attendance|check-in)\b/i.test(l)) warns.push(`warn: ${p}:${i + 1}: scope tripwire: ${l.trim().slice(0, 80)}`); });
  }
}

warns.forEach((w) => console.warn(w));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ok: framework checks passed (wave ${WAVE})`);
