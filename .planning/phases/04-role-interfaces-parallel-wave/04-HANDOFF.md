# Phase 4 handoff: role interfaces

Requirement ids: COORD-01..07, STUD-01..05, ADMIN-01..04 (design ids C1-C7, S1-S5, A1-A4). kb consulted: `dom-hmi-problems` (#1, #5), `dom-requirements`, `dom-flows`, `src-accessibility-areas`, `src-hmi-principles`, `adr-004-scope`.

Nothing is committed. The single Phase 4 commit is made after `gsd-verify-work` passes.

## 1. What changed

**Wave 0 (shared; the one allowed amendment to the Phase 3 freeze, approved 2026-10-20; re-frozen)**
- `components/ui/status-badge.tsx` and `app/globals.css`: eight new status keys (registered, waitlisted, todo, doing, done, overdue, clash, lowreg) with tokens; `tests/status.test.ts` now covers 17 keys.
- `lib/format.ts` (display zone Asia/Kolkata, date helpers), `lib/domain/{rules,drafts,catalog,allocations,people,views,admin}.ts`.
- `tests/format.test.ts`, `tests/domain-phase4.test.ts`.

**Coordinator** (`app/(coordinator)/**`, `tests/coordinator/**`): My Events, New event (template or blank), guided builder (details, venue, resources, tasks, review), event monitor, edit, change, Calendar, Tasks, Notifications, shared Review & Confirm flow.

**Student** (`app/(student)/**`, `tests/student/**`): Discover (next-events strip, filters, cards, register/waitlist/cancel), event detail, My events (agenda/month, reminders), My tasks (organizers only), Alerts.

**Admin** (`app/(admin)/**`, `tests/admin/**`): Dashboard, Approvals (queue, clash check, approve/return), Calendar (venue lanes, agenda), Venues and resources.

## 2. Requirements to screens

| Id | Where |
|---|---|
| COORD-01 | `/coordinator/new`, builder details step (autosave) |
| COORD-02 | builder venue step (`_lib/venues.ts`, `venue-step.tsx`) |
| COORD-03 | builder resources step |
| COORD-04 | builder tasks step, `/coordinator/tasks`, monitor |
| COORD-05 | builder review + `confirm-flow.tsx`, monitor approval state |
| COORD-06 | `/coordinator` (cards, seat meter, overdue/low badges), `/coordinator/[id]` |
| COORD-07 | `/coordinator/[id]/change`, cancel in monitor, `event_changed` notices |
| STUD-01 | `/student` (search, filters) |
| STUD-02 | `/student/events/[id]` |
| STUD-03 | register-flow, cancel-flow, waitlist on Discover and detail |
| STUD-04 | `/student/mine`, `/student/alerts` |
| STUD-05 | `/student/tasks` |
| ADMIN-01 | `/admin/approvals`, `/admin/approvals/[id]` |
| ADMIN-02 | `/admin/calendar` |
| ADMIN-03 | `/admin/catalog` |
| ADMIN-04 | `/admin` |

## 3. How to verify

Automated, on the merged tree (run by the orchestrator, 2026-10-20):
- `npm run db:reset`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 24 files, 184 tests passed (includes `tests/db-boundary.test.ts`).
- `npm run build`: succeeded; every role route is dynamic, none static.
- `npx opennextjs-cloudflare build`: completed.
- Frozen-file `git status --porcelain` check printed nothing; the Wave 0 set is exactly the files listed above. Each role layout calls `requireRole`; no `lib/db`, `getDb` or `getCloudflareContext` under `app/` outside `app/login`.
- Disjointness dry run: the only paths outside owned folders were `AGENTS.md` (block auto-written by `next dev` in one worktree) and `tsconfig.tsbuildinfo`; neither was copied.

Browser pass (Task 2, flows A coordinator, B admin, C cross-role story, D keyboard/size), run by the user. Recorded reply, verbatim: **"works"**. The user gave no per-flow PASS/FAIL notes, so nothing finer-grained is claimed here. The executors could not run the app in their worktrees (symlinked `node_modules`), so this reply is the only browser evidence.

Not covered by automated tests: the new coordinator builder and monitor screens (pure-logic tests only).

## 4. Open questions and assumptions (all `assumed` unless noted)

- A2: a "conflict" means overlap on a venue where at least one side is a draft/returned event, or a live event on a retired venue; cancelled events excluded, completed never conflict.
- COORD-07: editing a pending/approved/open event keeps its status (no re-approval); registrants get an `event_changed` notice; a no-op patch writes nothing.
- A3: display zone Asia/Kolkata; stored times stay UTC ISO.
- Utilisation basis 12 bookable hours a day; low registrations under 25% of capacity within 7 days of start; reminder window 2 days; autosave debounce 800ms.
- Template names are Workshop, Guest Lecture, Cultural Night and Blank (the UI-SPEC's Seminar/Fest do not exist in the seed). The schema has no template default resources or tasks, so steps 3 and 4 start empty.
- Monitor timeline shows only Created and Last updated (no status-history table).
- `reserved_peak` for resource totals is the largest single future reservation, not the true overlapping sum (`ponytail:` note in `catalog.ts`).
- Student My tasks is hidden for non-organizers; "Free today" window as built in `student/_lib`.
- Edit/builder venue checks run only when the venue id changes (an event already on a later-retired venue is not blocked). The change form's venue list is for the saved slot and can go stale if the time is edited; domain checks on save catch clashes.
- Live Summary `<details>` is open at every width (UI-SPEC wanted closed below 640px).
- The full seed event is Open Mic Night (capacity 2); the Tech Fest Keynote has capacity 400. Plan 04-07's flow C wording was wrong.

**Proposals for frozen files (not applied):** `.planning/phases/04-role-interfaces-parallel-wave/04-02-PROPOSALS.md`: `ConfirmDialog` needs a `destructive` variant (cancel registration currently renders in the accent colour), and "Go back" should come before "Confirm" in the DOM so initial focus lands on it.

## 5. Accessibility checklists (unticked; ticked by the team)

Each role, per the 04-UI-SPEC acceptance checklist:

### Coordinator (check: My Events, builder steps 1-5, monitor, change, Calendar, Tasks, Notifications)
- [ ] Every interactive element >= 44x44px at A and A+, >= 8px apart.
- [ ] Primary flow completable by keyboard alone; focus ring visible and not obscured; no traps.
- [ ] One `<h1>`; headings in order; landmarks; tables with captions and `th scope`.
- [ ] Every status is icon + word + colour from the shared table.
- [ ] Every field has a visible label, "required"/"(optional)" in words; errors inline with icon, summary Alert on submit.
- [ ] Review & Confirm on every irreversible action; focus on feedback after.
- [ ] A-/A/A+, 200% zoom, 320px: no clipping, no horizontal page scroll.
- [ ] Human error messages only.
- [ ] `prefers-reduced-motion` honoured.
- [ ] Dynamic results in polite live regions.

### Student (check: Discover, event detail, My events, My tasks, Alerts)
- [ ] Every interactive element >= 44x44px at A and A+, >= 8px apart.
- [ ] Primary flow completable by keyboard alone; focus ring visible and not obscured; no traps.
- [ ] One `<h1>`; headings in order; landmarks; tables with captions and `th scope`.
- [ ] Every status is icon + word + colour from the shared table.
- [ ] Every field has a visible label, "required"/"(optional)" in words; errors inline with icon, summary Alert on submit.
- [ ] Review & Confirm on every irreversible action; focus on feedback after.
- [ ] A-/A/A+, 200% zoom, 320px: no clipping, no horizontal page scroll.
- [ ] Human error messages only.
- [ ] `prefers-reduced-motion` honoured.
- [ ] Dynamic results in polite live regions.

### Admin (check: Dashboard, Approvals, Calendar, Venues and resources)
- [ ] Every interactive element >= 44x44px at A and A+, >= 8px apart.
- [ ] Primary flow completable by keyboard alone; focus ring visible and not obscured; no traps.
- [ ] One `<h1>`; headings in order; landmarks; tables with captions and `th scope`.
- [ ] Every status is icon + word + colour from the shared table.
- [ ] Every field has a visible label, "required"/"(optional)" in words; errors inline with icon, summary Alert on submit.
- [ ] Review & Confirm on every irreversible action; focus on feedback after.
- [ ] A-/A/A+, 200% zoom, 320px: no clipping, no horizontal page scroll.
- [ ] Human error messages only.
- [ ] `prefers-reduced-motion` honoured.
- [ ] Dynamic results in polite live regions.

## 6. Measurement instrument for `dom-hmi-problems` #1

No figures are recorded here. Results may only be entered by the team from real sessions, and only then marked `evidence`.

| Participant code | Task (Coordinator: create from template to submit) | Clicks | Seconds | Errors | Notes |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

Counting rules: a click is each pointer activation or key activation of a control, excluding typing characters. The timer starts at the New event button focus/click on My Events and stops when the Pending approval message appears. Repeat on the old-workflow baseline and on the app only if the team has a baseline.

## 7. Verification status

Marked verified by the user ("mark verified"). This was not a `gsd-verify-work` UAT run and no per-flow browser notes exist beyond the reply "works"; the a11y checklists and measurement sheet remain for the team.
