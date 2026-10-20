// Builds kb/manifest.json from frontmatter and fails if any note is malformed or INDEX.md misses an id.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kb = join(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = ['id', 'type', 'title', 'tags', 'confidence', 'summary'];
const CONFIDENCE = ['source', 'derived', 'assumed', 'evidence'];
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});

const notes = [], errors = [];
for (const p of walk(kb)) {
  const rel = relative(kb, p);
  if (rel === 'INDEX.md' || rel.endsWith('original.md')) continue;
  const m = readFileSync(p, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!m) { errors.push(`${rel}: no frontmatter`); continue; }
  const fm = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of REQUIRED) if (!fm[k]) errors.push(`${rel}: missing ${k}`);
  if (fm.confidence && !CONFIDENCE.includes(fm.confidence)) errors.push(`${rel}: bad confidence ${fm.confidence}`);
  notes.push({ ...fm, tags: (fm.tags || '').replace(/[\[\]]/g, '').split(',').map((t) => t.trim()).filter(Boolean), path: rel });
}

const ids = notes.map((n) => n.id);
for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) errors.push(`duplicate id ${id}`);
const index = readFileSync(join(kb, 'INDEX.md'), 'utf8');
for (const n of notes) if (!index.includes(n.id)) errors.push(`INDEX.md does not mention ${n.id}`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
writeFileSync(join(kb, 'manifest.json'), JSON.stringify(notes, null, 2) + '\n');
console.log(`ok: ${notes.length} notes -> kb/manifest.json`);
