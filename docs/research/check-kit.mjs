// Run from repo root: node docs/research/check-kit.mjs
// Checks tags, coverage, trace consistency, sections, persona frontmatter and labels.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const errors = [];
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : (errors.push(`${p}: file missing`), ''));
const ROLES = ['Coordinator', 'Student', 'Admin'];
const MUST = [3, 4, 7, 8]; // problems that every role section must carry
const tagged = {}; // P id -> Set of question ids (both instruments)
let total = 0;

for (const [file, prefix] of [['interview-guide', 'Q'], ['questionnaire', 'QN']]) {
  const path = `docs/research/${file}.md`;
  const lines = read(path).split('\n');
  const seen = new Set();
  const cover = Object.fromEntries(ROLES.map((r) => [r, new Set()]));
  let role = null;
  for (const l of lines) {
    if (/^## /.test(l)) {
      role = ROLES.find((r) => l.includes(r)) ?? null;
      continue;
    }
    const m = l.match(/^[-* ]*(QN?-[CSA]\d{2})\./);
    if (!m) continue;
    const id = m[1];
    total++;
    if (!id.startsWith(prefix + '-')) errors.push(`${path}: ${id} has the wrong id prefix`);
    if (seen.has(id)) errors.push(`${path}: duplicate id ${id}`);
    seen.add(id);
    const t = l.match(/\[(P\d+(?:, ?P\d+)*)\]\s*$/);
    if (!t) { errors.push(`${path}: ${id} has no trailing [P#] tag`); continue; }
    for (const p of t[1].split(/, ?/)) {
      const n = Number(p.slice(1));
      if (n < 1 || n > 10) { errors.push(`${path}: ${id} tag ${p} out of range`); continue; }
      (tagged[p] ??= new Set()).add(id);
      if (role) cover[role].add(n);
    }
  }
  for (const r of ROLES) {
    if (!lines.some((l) => /^## /.test(l) && l.includes(r))) errors.push(`${path}: no ${r} section`);
    for (const n of MUST) if (!cover[r].has(n)) errors.push(`${path}: ${r} section has no question tagged P${n}`);
  }
  if (file === 'interview-guide' && !lines.some((l) => l.includes('Probes:'))) errors.push(`${path}: no Probes: line`);
}

for (let i = 1; i <= 10; i++) if (!tagged[`P${i}`]) errors.push(`P${i} is not covered by any question`);

// Trace matrix: last table row whose first cell is exactly the P id.
const traceRows = read('docs/research/question-trace.md').split('\n');
for (let i = 1; i <= 10; i++) {
  const row = traceRows.filter((l) => l.startsWith(`| P${i} |`)).pop();
  if (!row) { errors.push(`question-trace.md: no row for P${i}`); continue; }
  const inRow = new Set(row.match(/QN?-[CSA]\d{2}/g) ?? []);
  const want = tagged[`P${i}`] ?? new Set();
  const diff = [...want].filter((x) => !inRow.has(x)).concat([...inRow].filter((x) => !want.has(x)));
  if (diff.length) errors.push(`question-trace.md: P${i} row differs from tags (${diff.join(', ')})`);
}

const LABEL = /assumed, pending research/i;
const personas = readdirSync('docs/personas').filter((f) => /^persona-.*\.md$/.test(f));
for (const need of ['template', 'coordinator', 'student', 'admin'])
  if (!personas.includes(`persona-${need}.md`)) errors.push(`docs/personas/persona-${need}.md: file missing`);
for (const f of personas) {
  const p = `docs/personas/${f}`;
  const s = read(p);
  const front = s.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  if (!/^confidence: assumed$/m.test(front)) errors.push(`${p}: frontmatter needs the line "confidence: assumed"`);
  if (!LABEL.test(s.replace(/<!--[\s\S]*?-->/g, ''))) errors.push(`${p}: missing the visible assumed label`);
}
const kbp = read('kb/domain/personas.md');
if (!LABEL.test(kbp)) errors.push('kb/domain/personas.md: missing the visible assumed label');
if (!/^id: dom-personas$/m.test(kbp)) errors.push('kb/domain/personas.md: id dom-personas lost');

const ph = read('docs/research/results-placeholder.md');
if (!/evidence/i.test(ph) || !/only the team/i.test(ph)) errors.push('results-placeholder.md: must say only the team records evidence');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ok: kit checks passed (${total} questions)`);
