# Phase 2: Requirements & Framework - Research

**Researched:** 2026-10-20
**Domain:** GDD paper design (goals/tasks, scenarios, requirements, IA, flows, low-fi wireframes) as Markdown + Mermaid + ASCII. Docs-only.
**Confidence:** HIGH for structure and check design (from repo files); MEDIUM for Mermaid syntax details (training knowledge, `[ASSUMED]`, not re-verified this session).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Extend `kb/domain/goals-tasks.md` in place with a per-role table: goal -> task -> step -> requirement id (C1-C7, S1-S5, A1-A5, X1-X5). Add a coverage check at the bottom listing every requirement id and the task that satisfies it; no orphan tasks, no orphan ids.
- D-02: Student Organizer is a flag, not a fourth interface (`adr-002-roles`); Organizer tasks live under Student "My Tasks". Keep `adr-002-roles` confidence `assumed`.
- D-03: Keep confidence `derived` on goals/tasks, scenarios and flows. Nothing is `evidence`.
- D-04: Keep the three narrative scenarios; add per role one test task as a Phase 6 task-sheet entry (start state, goal in plain words, success criterion, max time), mirroring `src-evaluation-methods`. Add a second scenario per role for the error/edge path (Coordinator: venue clash; Student: full event -> waitlist; Admin: return with reason).
- D-05: Test tasks never name UI features as instructions.
- D-06: Top-level nav max 5 per role. Coordinator: My Events / Calendar / Tasks / Notifications. Student: Discover / My Events / My Tasks (organizer only) / Notifications. Admin: Approvals / Calendar / Venues & Resources / Reports / Notifications. A4 dashboard is Admin home, above Approvals.
- D-07: IA = one Markdown file per interface in `docs/ia/` with Mermaid sitemap + nav table (item, goal served, requirement ids), plus `docs/ia/shared-vocabulary.md` (X4).
- D-08: Mobile-first Student (bottom tab bar), desktop-first Coordinator/Admin (left sidebar collapsing to menu); all responsive.
- D-09: One Mermaid flowchart per primary journey in `docs/flows/` (coordinator-create-event, student-register, admin-approve) plus organizer-mark-task-done. Mark Review & Confirm before every irreversible action and system-prefill steps. `kb/domain/flows.md` stays the one-page summary linking to `docs/flows/`.
- D-10: Each flow includes the error branch for its clash/duplicate case with the human message.
- D-11: Wireframes are ASCII/Markdown boxes, one file per interface (`docs/wireframes/{coordinator,student,admin}.md`). Greyscale; status = icon + vocabulary text + colour-name annotation. Every primary IA screen has a numbered wireframe in flow order citing requirement ids.
- D-12: Screens to wire. Coordinator: My Events, New Event (template + details), Venue & slot picker, Resources, Tasks, Review & Confirm, Submitted/Monitor, Event summary. Student: Discover, Event detail, Review & Confirm (register), My Events + calendar, My Tasks, Notifications. Admin: Dashboard, Approvals queue + detail (clash check), Calendar with conflicts, Venues & Resources, Reports.
- D-13: Each role's primary screen shows A-/A/A+ control position, an empty state and a plain-language error example (X2, X3).
- D-14: Finalise `dom-requirements` by adding one testable acceptance line and a must/should priority per requirement, ids unchanged. No new requirements.

### Claude's Discretion
- Diagrams as Mermaid text in Markdown (no rendering toolchain).
- Exact file names and ordering inside `docs/ia/`, `docs/flows/`, `docs/wireframes/`.
- Wireframe fidelity details.

### Deferred Ideas (OUT OF SCOPE)
- Hi-fi mockups in Figma/Canva; Hindi/Marathi variants (I18N-01).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRAM-01 | Goals/task analysis per role linked to requirement ids | Table format + coverage-check section (Pattern 1); check script parses ids |
| FRAM-02 | Scenarios and test tasks per role | Test-task template (Pattern 2) |
| FRAM-03 | IA + nav map per interface | Mermaid sitemap + nav table with `Screen:` ids (Pattern 3) |
| FRAM-04 | Task flows per primary journey | Mermaid flowchart with node-naming convention for Review & Confirm (Pattern 4) |
| FRAM-05 | Low-fi wireframes for every primary screen | Numbered ASCII wireframe headings keyed to IA screen ids (Pattern 5) |
</phase_requirements>

## Summary

This phase writes documents only. Every needed input already exists in the repo: requirement ids (`dom-requirements`), one-line flows and nav (`dom-flows`), three narrative scenarios (`dom-scenarios`), and a goals table with no task-level detail (`dom-goals-tasks`). The work is expansion and cross-linking, not discovery. No libraries, no packages, no external services. Node v24 is installed for the check script (node:fs only). [VERIFIED: `node --version` = v24.21.0]

The one real design risk is consistency drift across ~12 new files. The mitigation is a single stable id scheme (screen ids, flow node names) that a ~60-line node script can cross-check, mirroring `docs/research/check-kit.mjs`. Everything else is writing quality.

**Primary recommendation:** Define screen ids (`CO-01`, `ST-01`, `AD-01`...) in the IA files, reuse them as wireframe headings and flow node prefixes, and ship `docs/check-framework.mjs` that fails on any orphan requirement id, IA screen without wireframe, or irreversible action without a Review & Confirm node.

## Architectural Responsibility Map

Not applicable as a tier map: no code. The only responsibility split that matters downstream: wireframes and flows (Phase 2) are the contract Phase 4 agents build from; tokens and components are Phase 3. Phase 2 must not specify colours, fonts or component APIs.

## Standard Stack

None to install. Tools:
| Tool | Use | Note |
|------|-----|------|
| Markdown + YAML frontmatter | all deliverables | kb notes keep `id,type,title,tags,confidence,sources,summary,updated` |
| Mermaid text (` ```mermaid `) | sitemaps, flowcharts | Renders on GitHub/VS Code preview; no toolchain needed (CONTEXT discretion) |
| ASCII boxes in fenced code blocks | wireframes | Monospace, greyscale |
| `node` (v24, `node:fs`) | `docs/check-framework.mjs` | Same pattern as `check-kit.mjs`; no deps |

## Package Legitimacy Audit

No external packages are installed in this phase. Nothing to audit. Do not add mermaid-cli or any renderer.

## Architecture Patterns

### Flow of work (dependency order)
```
dom-requirements (finalise D-14) ──> goals-tasks (D-01, uses ids)
        │                                   │
        └──> scenarios + test tasks (D-04) <┘
                         │
                 IA files + shared-vocabulary (screen ids defined here)
                         │
          ┌──────────────┴──────────────┐
     flows (nodes reference screen ids)  wireframes (headings = screen ids)
          └──────────────┬──────────────┘
                  check-framework.mjs + kb/INDEX + build-index
```
Plan waves: W1 requirements + goals-tasks + scenarios (kb notes); W2 IA (defines screen ids); W3 flows and wireframes (parallelisable per role); W4 check script, `flows.md` links, INDEX rows, STATE.

### Recommended structure
```
kb/domain/{requirements,goals-tasks,scenarios,flows}.md   # edited in place
docs/ia/{coordinator,student,admin,shared-vocabulary}.md
docs/flows/{coordinator-create-event,student-register,admin-approve,organizer-mark-task-done}.md
docs/wireframes/{coordinator,student,admin}.md
docs/check-framework.mjs
```

### Pattern 1: Goals-tasks table (FRAM-01)
Columns: `Goal | Task | Steps | Req ids`. One row per task. Req ids written as bare tokens (`C1`, `X2`) so the script can regex them. End with `## Coverage` listing each id -> task name. X1-X5 map to the tasks where they bite (e.g. X2 -> Submit, Register, Approve, Cancel), not left as a free-floating list. Organizer tasks sit in the Student table, flagged "Organizer".

### Pattern 2: Test task entry (FRAM-02)
```
### TT-S1 Student: register (Rohan)
- Start state: logged in as Rohan, on home screen, phone.
- Goal (plain words): You want to attend the Robotics Workshop this week.
- Success: registered; can say how many seats remain and confirm he is registered.
- Max time: 90 s. Metrics to capture later: success y/n, time, errors, clicks.
- Reqs: S1 S2 S3 X2
```
The goal sentence must not contain UI nouns (button, tab, filter, menu). Mark "AI-drafted, to be run by the team" and confidence `derived`.

### Pattern 3: IA file (FRAM-03)
Mermaid sitemap plus nav table `Item | Screen id | Goal served | Req ids`. Mermaid pitfall `[ASSUMED]`: labels containing `( ) & /` must be quoted: `A["Venues & Resources"]`. Use `flowchart TD`, not legacy `graph`, and avoid the reserved word `end` as a lowercase node id.

### Pattern 4: Flow (FRAM-04)
`flowchart TD` with a node convention the script can grep:
- Review & Confirm nodes: label begins `Review & Confirm` and id begins `RC` (e.g. `RC1["Review & Confirm: submit event"]`).
- Prefill nodes: label begins `Prefill:`.
- Irreversible action nodes: label begins `DO:` (submit, register, cancel, approve, return). Rule: every `DO:` node has an `RC` node as its direct predecessor (edge `RC --> DO`).
- Error branch: decision diamond ending in a node whose label holds the human message text in quotes (D-10).
Quote all labels containing punctuation.

### Pattern 5: Wireframes (FRAM-05)
Heading `## CO-03 Venue & slot picker (C2, X1)`, then fenced ASCII box with: header with A-/A/A+ position on primary screens, status chips written `[! Pending - amber]` style (icon + vocabulary word + colour name, from `dom-status-vocabulary`: Draft, Pending, Approved, Open, Ongoing, Completed, Cancelled), nav (bottom tab for Student, sidebar for others), and for each role's primary screen a `Empty:` and `Error:` example in plain language. Order headings in flow order so a reader can walk the flow; add `Next: CO-04` lines.

### Anti-patterns
- Naming UI controls in test-task goals (violates D-05).
- Colour as the only status cue; hex values or fonts in wireframes (Phase 3 territory).
- Adding requirements or screens not in `adr-004-scope` (email, payments, check-in). Proposals go to `.planning/`.
- Copying attendance-reference features.
- Setting any confidence to `evidence`.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Diagram rendering | Image export pipeline | Mermaid text in Markdown | No toolchain, diffable |
| Coverage tracking | Spreadsheet | Check script over ids | Fails loudly on drift |
| Wireframe tool | Figma files | ASCII in fenced blocks | Locked D-11 |

## Common Pitfalls

1. **Id drift between files.** IA lists a screen the wireframes omit. Avoid: screen ids are the join key; script enforces.
2. **X-ids left orphaned.** X1-X5 are cross-cutting and easy to forget in task tables. Map each to concrete tasks and screens; script checks all 22 ids appear in goals-tasks.
3. **Review & Confirm missed on "return" and "cancel".** D-09 lists return (admin) and cancel (coordinator, student); flows must cover them even if only the primary journey is drawn. Add the cancel branch in coordinator and student flows.
4. **Admin nav has 5 items plus a Dashboard home.** Dashboard is the home above Approvals, not a sixth nav item (D-06). Keep max 5.
5. **Student nav count.** Discover / My Events / My Tasks (organizer only) / Notifications = 4; tab bar must hide My Tasks for non-organizers; show that in the IA.
6. **Test tasks read as instructions.** Review them against D-05 with a grep for button|tab|filter|menu|click in TT goal lines.
7. **Mermaid parse errors** from unquoted `&`, parentheses, colons. Quote all labels `[ASSUMED]`. No renderer is required, so also eyeball in VS Code preview once.
8. **KB check break.** Editing kb notes requires frontmatter intact and `updated` refreshed; run `node kb/tools/build-index.mjs`. New kb notes need an INDEX row (prefer not adding new kb notes; `docs/` files are not indexed).
9. **Invented evidence.** Scenarios use named characters (Anita, Rohan, Dr. Sharma) as fiction; never write numbers as observed results. The "38 of 60 registered" is scenario fiction, label it illustrative.

## Code Examples

### Check script skeleton (`docs/check-framework.mjs`, run from repo root)
```js
import { readFileSync, existsSync } from 'node:fs';
const errors = [];
const read = (p) => existsSync(p) ? readFileSync(p, 'utf8') : (errors.push(`${p}: missing`), '');
const IDS = [...'C1234567'.slice(1).split('').map(n=>'C'+n), ...[1,2,3,4,5].flatMap(n=>['S','A','X'].map(p=>p+n))];
// 1 FRAM-01: every id in goals-tasks (word-bounded)
const gt = read('kb/domain/goals-tasks.md');
for (const id of IDS) if (!new RegExp(`\\b${id}\\b`).test(gt)) errors.push(`goals-tasks: ${id} missing`);
// 2 FRAM-03/05: each IA screen id has a wireframe heading
for (const [role, wf] of [['coordinator','CO'],['student','ST'],['admin','AD']]) {
  const ia = read(`docs/ia/${role}.md`), w = read(`docs/wireframes/${role}.md`);
  const screens = new Set(ia.match(new RegExp(`\\b${wf}-\\d{2}\\b`, 'g')) ?? []);
  if (!screens.size) errors.push(`ia/${role}: no screen ids`);
  for (const s of screens) if (!new RegExp(`^## ${s}\\b`, 'm').test(w)) errors.push(`wireframes/${role}: ${s} missing`);
}
// 3 FRAM-04: every DO: node has an RC node pointing at it
for (const f of ['coordinator-create-event','student-register','admin-approve','organizer-mark-task-done']) {
  const t = read(`docs/flows/${f}.md`);
  const dos = [...t.matchAll(/\b(\w+)\["DO:/g)].map(m=>m[1]);
  if (f !== 'organizer-mark-task-done' && !/\bRC\w*\["Review & Confirm/.test(t)) errors.push(`${f}: no Review & Confirm node`);
  for (const d of dos) if (!new RegExp(`\\bRC\\w*\\s*-->(\\|[^|]*\\|)?\\s*${d}\\b`).test(t)) errors.push(`${f}: ${d} not preceded by RC`);
}
// 4 honesty: no evidence confidence
// (grep docs/ and kb/domain for "^confidence: evidence")
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('ok: framework checks passed');
```
Planner: tidy the id list (write the 22 ids explicitly), and decide whether the organizer flow needs an RC (marking a task done is reversible, so likely no; the script above exempts it).

## State of the Art

Not time-sensitive. GDD artefacts are method-defined (`src-gdd-process`). Mermaid `flowchart` supersedes `graph` syntax `[ASSUMED]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mermaid needs quoted labels for `&`, parentheses, colons; `flowchart` preferred over `graph` | Patterns 3-4, Pitfall 7 | Diagram fails to render; fix by quoting, low cost |
| A2 | Marking an organizer task done is reversible so needs no Review & Confirm | Code Examples | If team disagrees, add RC node to that flow; user should confirm |
| A3 | Screen id scheme CO/ST/AD-NN is acceptable (Claude's discretion on naming) | Summary | Rename costs little if done before check script |

## Open Questions (RESOLVED)

1. **Does "mark task done" count as irreversible?** CONTEXT lists submit, register, cancel, approve, return only. Recommend no RC, with an undo affordance noted in the wireframe. RESOLVED (auto-mode): reversible, no Review & Confirm, flow must contain Undo. Overturn later if the team disagrees (assumption A2).
2. **Priority labelling (D-14).** RESOLVED (auto-mode): planner assigns must/should, tagged `derived`. Must vs should per requirement is the planner's call; recommend all of C1,C2,C5,S1-S3,A1,X1-X5 as must; A3,A5,C7,S4,S5 as should is a derived suggestion, not research, tag as `derived`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | check script, KB check | yes | v24.21.0 | none needed |

No other external dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (node script + grep), same as Phase 1 |
| Config file | none |
| Quick run command | `node docs/check-framework.mjs` |
| Full suite command | `node docs/check-framework.mjs && node docs/research/check-kit.mjs && node kb/tools/build-index.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRAM-01 | All 22 ids (C1-C7,S1-S5,A1-A5,X1-X5) appear in goals-tasks; Coverage section present | script | `node docs/check-framework.mjs` | Wave 0 |
| FRAM-01 | Student table flags Organizer rows; no 4th interface | grep | `grep -ci organizer kb/domain/goals-tasks.md` (>0) | after W1 |
| FRAM-02 | Each role has a `TT-` test task and an edge scenario | grep | `for r in C S A; do grep -q "^### TT-$r" kb/domain/scenarios.md \|\| echo MISSING $r; done` | after W1 |
| FRAM-02 | Test task goals name no UI controls | grep tripwire | `grep -iE "^- Goal.*(button\|tab\|filter\|menu\|click)" kb/domain/scenarios.md` (empty = pass) | after W1 |
| FRAM-03 | Each IA file has mermaid block + nav table; nav items <= 5 | script/grep | `grep -c '```mermaid' docs/ia/*.md` | after W2 |
| FRAM-04 | Every `DO:` node preceded by an `RC` node; each flow has an error branch | script | `node docs/check-framework.mjs` | Wave 0 |
| FRAM-05 | Every IA screen id has a `## <id>` wireframe heading | script | `node docs/check-framework.mjs` | Wave 0 |
| All | No file claims `confidence: evidence`/`source` for new docs | grep | `grep -rlE "^confidence: (evidence\|source)$" docs/ kb/domain/goals-tasks.md kb/domain/scenarios.md kb/domain/flows.md` (empty) | n/a |
| All | KB check passes | script | `node kb/tools/build-index.mjs` | exists |
| All | No attendance/out-of-scope features | grep | `grep -rniE "attendance\|email\|sms\|payment\|qr" docs/ia docs/flows docs/wireframes` (review hits; mentions in "out of scope" text are fine) | n/a |

### Sampling Rate
- Per task commit: `node docs/check-framework.mjs` once it exists (write it early with expected failures), else the task's grep.
- Per wave merge: full suite command.
- Phase gate: full suite green plus a manual walkthrough of each primary flow through the numbered wireframes (success criterion 5; cannot be automated).

### Wave 0 Gaps
- [ ] `docs/check-framework.mjs` - covers FRAM-01, 03, 04, 05
- No framework install needed.

## Security Domain

Not applicable: docs-only, no code, data, or secrets. Honesty control instead: no invented research results; mark AI-drafted test tasks as such. `security_enforcement` not set to false, so noted: ASVS categories none apply this phase; wireframes should, however, show Review & Confirm and plain-language errors that Phase 4/5 will implement (X2).

## Sources

### Primary (HIGH, repo files read this session)
- `.planning/phases/02-requirements-framework/02-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` (Phase 2), `AGENTS.md`
- `kb/domain/{goals-tasks,requirements,flows,scenarios}.md`
- `docs/research/check-kit.mjs`, `.planning/phases/01-research-modeling-kit/01-VALIDATION.md`

### Tertiary (LOW)
- Mermaid syntax quoting rules: training knowledge, not re-verified (A1).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (nothing to install)
- Architecture/check design: HIGH (mirrors proven Phase 1 pattern)
- Pitfalls: MEDIUM (Mermaid specifics assumed)

**Research date:** 2026-10-20
**Valid until:** 30 days (stable)
