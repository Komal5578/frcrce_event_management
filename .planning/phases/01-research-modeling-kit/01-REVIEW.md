---
phase: 01-research-modeling-kit
reviewed: 2026-10-20T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - docs/research/check-kit.mjs
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-10-20
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`node docs/research/check-kit.mjs` run from the repo root currently passes (77 questions). The section tracking is correct for the real headings (`## Section A: Coordinators`, and so on). `###` subheadings do not reset the role, and `| P1 |` does not collide with `| P10 |`. No crashes or off-by-one errors were found.

The persona and section-tag checks are weaker than their error messages claim, so they can pass when they should fail. I confirmed the persona false pass on a copy of the repo in the scratchpad. None of this is a BLOCKER for a docs-only phase.

## Warnings

### WR-01: Persona `confidence: assumed` and the "visible" label are checked anywhere in the file (false pass)

**File:** `docs/research/check-kit.mjs:59-65`
**Issue:** `^confidence: assumed$` with the `m` flag matches any line in the file, including the body or a fenced code block. It does not match only the frontmatter. `LABEL` also matches anywhere, including an HTML comment, so it does not prove the label is visible. I tested a persona whose frontmatter says `confidence: evidence`, with the label only inside `<!-- -->` and `confidence: assumed` only inside a code fence. The checker exited 0. This weakens the "never invent evidence" guard the check exists for.
**Fix:**
```js
const fm = s.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
if (!/^confidence: assumed\s*$/m.test(fm)) errors.push(`${p}: needs the line "confidence: assumed" in frontmatter`);
const body = s.slice(fm.length).replace(/<!--[\s\S]*?-->/g, '');
if (!LABEL.test(body)) errors.push(`${p}: missing the visible assumed label`);
```
The same `LABEL` strip applies at line 67 for `kb/domain/personas.md`. Line 68's `id:` check also has no frontmatter scope. The `\s*$` allows trailing spaces or CR.

### WR-02: Persona files are hardcoded, not globbed

**File:** `docs/research/check-kit.mjs:60`
**Issue:** The task and header describe `docs/personas/*.md`. A fifth persona file, such as an Organizer persona, is never checked. A new `confidence: evidence` persona would pass unnoticed.
**Fix:** Use `readdirSync('docs/personas').filter((f) => f.endsWith('.md'))`. This is stdlib and one import. `persona-template.md` is then included automatically.

### WR-03: Question id letter is never tied to its section role

**File:** `docs/research/check-kit.mjs:23-36`
**Issue:** `role` comes from the heading and the id letter `[CSA]` comes from the line, and the two are never compared. A `Q-S07` placed in the Coordinator section counts toward Coordinator's P3/P4/P7/P8 coverage. The per-role coverage guarantee is therefore only as good as the author's id discipline. In my mutation test, renaming `Q-C01` to `Q-S99` was caught only incidentally by the trace diff. If the trace row were edited to match, it would pass.
**Fix:**
```js
const want = { Coordinator: 'C', Student: 'S', Admin: 'A' }[role];
if (role && id.split('-')[1][0] !== want) errors.push(`${path}: ${id} is in the ${role} section`);
```

### WR-04: Questions outside a role heading are silently ignored for coverage

**File:** `docs/research/check-kit.mjs:19-21, 36`
**Issue:** Any `## ` heading that contains no role name sets `role = null`. Questions under it still count toward `tagged` (so global P coverage and the trace pass), but they count toward no role's coverage. This is the safe direction. The reverse is the problem: `find` uses substring match with Coordinator first. A heading like `## Section D: Shared items for Admins and Coordinators` maps to Coordinator, and the Admin questions are then credited to Coordinator. The "no Admin section" check at line 40 uses the same loose `includes`, so it is also satisfied by that heading. A broken section structure can therefore still pass.
**Fix:** Anchor to the real heading shape, such as `/^## Section [A-C]: (Coordinators|Students|Admins)\b/`. Or at least error when a heading matches more than one role, or when a question is found with `role === null`. Add that error and keep the intro and wrap-up headings question-free.

### WR-05: Tag normalisation mismatch (P01) and misleading errors on near-miss formatting

**File:** `docs/research/check-kit.mjs:30-36, 51`
**Issue:**
- A tag such as `[P08]` passes the range check, because `Number('08')` is 8. But `tagged` and `cover` use different keys: `tagged['P08']` versus `cover[role].add(8)`. P8 then looks uncovered in the trace diff, and the error says "P8 row differs from tags (Q-C01)", which hides the real cause. I reproduced this.
- Tag regex `\[(P\d+(?:, ?P\d+)*)\]\s*$` requires the tag to be last on the line. A trailing `_`, `*` or `.` after the bracket gives "no trailing [P#] tag". That is acceptable, but the error should name the rule.
- The trace lookup `startsWith('| P1 |')` requires exactly one space on each side. A table reformatter (`|P1|` or `| P1  |`) produces "no row for P1", a false failure.

**Fix:**
```js
const key = 'P' + Number(p.slice(1));
(tagged[key] ??= new Set()).add(id);
```
For the trace, use `/^\|\s*P1\s*\|/` built per i.

## Info

### IN-01: Paths are relative to cwd, not to the script

**File:** `docs/research/check-kit.mjs:13, 49, 61, 66, 70`
**Issue:** Running from any directory other than the repo root fails with a "file missing" error for every file. This fails loudly (not a false pass), but it makes `npm`/hook use brittle.
**Fix:** `const root = new URL('../../', import.meta.url).pathname;` and prefix every path with it, or `process.chdir(root)` once at the top.

### IN-02: `total` counts duplicates and untagged lines; `Probes:` check is global

**File:** `docs/research/check-kit.mjs:26, 43`
**Issue:** `total++` runs before the duplicate and tag checks, so the "N questions" success line overstates unique questions if the checks were weakened. The `Probes:` check passes if a single `Probes:` appears anywhere in the guide, so one probe line satisfies it even if the other 40 questions have none.
**Fix:** Count after the validation, for example `seen.size`. Optionally require a `Probes:` line for each core question. Skip if the team does not want that constraint.

### IN-03: Trace row id extraction is coarse

**File:** `docs/research/check-kit.mjs:53`
**Issue:** `row.match(/QN?-[CSA]\d{2}/g)` also scans the Note column. An id quoted in prose in the note, such as "see Q-C05", counts as a listed question, and an id range such as `Q-C01..Q-C05` is not expanded. Today's notes contain no ids, so this is latent.
**Fix:** Split the row on `|` and only scan cells 2 and 3: `row.split('|').slice(2, 4).join(' ')`.

---

_Reviewed: 2026-10-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
