# Phase 4: Role Interfaces (parallel wave) - Pattern Map

**Mapped:** 2026-10-20
**Files analyzed:** 22 (patterns; per-role screens grouped by shape)
**Analogs found:** 22 / 22 (all role-match or better; no pure "no analog" except client-only UI, see end)

Repo is small (6 domain files, 3 role stubs, 9 ui components, 9 test files), so every analog below was read in full.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/domain/drafts.ts` (createDraft, saveDraft, listTemplates, updateEvent, advanceEvent) | service | CRUD | `lib/domain/events.ts` (`submitEvent`, `cancelEvent`) | exact |
| `lib/domain/catalog.ts` (listVenues, listResources, saveVenue, saveResource) | service | CRUD | `lib/domain/venues.ts` (reads) + `events.ts` (admin gate) | role-match |
| `lib/domain/allocations.ts` (listAllocations, setAllocation, createTask, listEventTasks) | service | CRUD, batch | `lib/domain/events.ts` `cancelEvent` (batch) + `tasks.ts` | role-match |
| `lib/domain/people.ts` (listStudents, listMyRegistrations, listMyTasks, isOrganizer) | service | request-response (read) | `lib/domain/notifications.ts` `listNotifications`, `registrations.ts` `seatCounts` | exact |
| `lib/domain/admin.ts` (listBookings, event allocations for admin) | service | request-response (read) | `lib/domain/venues.ts` | role-match |
| `tests/domain-phase4.test.ts` | test | request-response | `tests/domain.test.ts` | exact |
| `components/ui/status-badge.tsx` (+8 keys) | component | transform | itself (`STATUS_META` table) | exact |
| `app/globals.css` (+8 token pairs) | config | n/a | existing `--color-status-*` lines 19-36 | exact |
| `tests/status.test.ts` (update, see warning) | test | transform | itself | exact |
| `app/(role)/layout.tsx` x3 (add navItems) | layout/guard | request-response | current `app/(coordinator)/layout.tsx` | exact |
| `app/(role)/<role>/**/page.tsx` (async Server Components) | component (page) | request-response (read) | `app/(coordinator)/coordinator/page.tsx` stub | role-match |
| `app/(role)/<role>/**/actions.ts` | controller (server action) | request-response (write) | RESEARCH Pattern 1 + `app/login/actions.ts` | role-match |
| `app/(role)/<role>/_components/*.tsx` (client: RegisterFlow, ConfirmFlow, AutosaveStatus) | component (client) | event-driven | `components/ui/confirm-dialog.tsx`, `app/design/dialog-demo.tsx`, `app/login/login-form.tsx` | role-match |
| `app/(role)/<role>/_lib/*.ts` (pure helpers: filter, overdue, utilisation, calendar grouping, form parsing) | utility | transform | `visibleWhere` in `events.ts` (pure, constant) | partial |
| `tests/<role>/actions.test.ts` | test | request-response | `tests/domain.test.ts` + RESEARCH "Domain test for a wave" | role-match |
| `tests/<role>/*.test.ts` (pure helpers) | test | transform | `tests/status.test.ts`, `tests/contrast.test.ts` | role-match |

## Pattern Assignments

### Wave 0: new `lib/domain/*.ts` files (service, CRUD)

**Analog:** `lib/domain/events.ts` (read in full, 74 lines). All new domain fns copy this exact shape.

**Imports** (`events.ts` 1-3):
```typescript
import { getDb } from "@/lib/db";
import { DomainError, guard } from "@/lib/errors";
import { requireActorRole, type Actor } from "./actor";
```

**Owner-scoped UPDATE with fallback to precise error** (`events.ts` 36-45), copy for `saveDraft`/`updateEvent`/`advanceEvent`:
```typescript
export async function submitEvent(actor: Actor, eventId: string): Promise<void> {
  requireActorRole(actor, "coordinator");
  const r = await guard(() => getDb().prepare(
    "UPDATE events SET status = 'pending' WHERE id = ?1 AND coordinator_id = ?2 AND status IN ('draft','returned')")
    .bind(eventId, actor.id).run());
  if (r.meta.changes > 0) return;
  const e = await manageableEvent(actor, eventId);   // NOT_ALLOWED if not owner, else...
  throw new DomainError("BAD_STATE", `This event is already ${e.status}; only drafts and returned events can be submitted.`);
}
```
Rules to copy: role check first via `requireActorRole`; ownership and state go in the WHERE; `changes === 0` then `manageableEvent` to pick NOT_ALLOWED vs BAD_STATE; every DB call wrapped in `guard()`; bind params only (constant SQL, `tests/db-boundary.test.ts` line 29 forbids template-literal `prepare(`...${}`)`). Whitelist columns in `saveDraft` (never `status`, `coordinator_id`, `return_reason`). Validate ISO `YYYY-MM-DDTHH:MM:SS.mmmZ` and `ends > starts` in TS, throw `new DomainError("INVALID_INPUT", "<human text>")`.

**Admin-only gate + input validation** (`events.ts` 47-56, for `saveVenue`/`saveResource`):
```typescript
requireActorRole(actor, "admin");
const why = reason?.trim() ?? "";
if (!approve && !why) throw new DomainError("INVALID_INPUT", "Say why you are returning this event so the coordinator can fix it.");
```

**Atomic multi-statement (createTask + `task_assigned` notification, `setAllocation`)** (`events.ts` 63-74):
```typescript
const db = getDb();
await guard(() => db.batch([
  db.prepare("UPDATE events SET status = 'cancelled', cancel_reason = ?2 WHERE id = ?1 AND status = ?3").bind(eventId, reason?.trim() || null, e.status),
  db.prepare("INSERT INTO notifications (id, user_id, event_id, kind, body) SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'event_cancelled', ?2 FROM registrations r WHERE r.event_id = ?1 AND r.status IN ('confirmed','waitlisted')").bind(eventId, body),
]));
```
Use `lower(hex(randomblob(16)))` or `crypto.randomUUID()` (as `registrations.ts` line 16) for new ids.

**Read lists** (analog `notifications.ts` 17-21, `venues.ts` 8-14): `return guard(async () => (await getDb().prepare("...").bind(...).all<RowType>()).results);` with an inline row type. For venue/resource lists student-visible, skip the role check; for catalog writes use `requireActorRole`.

**Student-safe counts** (copy `registrations.ts` 36-45, `seatCounts`): student identity never returned; reuse `visibleWhere(actor)` from `./events` for any new read that must respect visibility (e.g. `listEventsWithSeats` to avoid N+1):
```typescript
"... FROM events e" + visibleWhere(actor) + " AND e.id = ?2").bind(actor.id, eventId)
```
(`visibleWhere` returns a constant string, so concatenation is allowed; `?1` is always the actor id.)

**`listMyTasks` / `isOrganizer`:** model on `tasks.ts` 11-14 WHERE (`assignee_id = ?3`), and `listNotifications` (`WHERE user_id = ?1`).

**Error mapping:** `lib/errors.ts` `ErrorCode` and `humanize` (lines 3-33) already cover VENUE_CLASH, RESOURCE_SHORT, EVENT_FULL, BAD_STATE, `events_complete_unless_draft`, `events_time_order`. New domain fns should throw `DomainError(code, humanText)` themselves; do not add codes (frozen file). `humanize` hides sqlite text from users.

**Test:** `tests/domain-phase4.test.ts` copies `tests/domain.test.ts` (below).

---

### `tests/domain-phase4.test.ts` and wave action tests (test)

**Analog:** `tests/domain.test.ts` lines 1-30, 46-60.

**Harness** (lines 1-8, 15-25, 31):
```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "./helpers/sqlite";

let db: DatabaseSync;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));

const COORD = { id: "a0000000-0000-0000-0000-000000000001", role: "coordinator" as const };
const ADMIN = { id: "a0000000-0000-0000-0000-000000000003", role: "admin" as const };
const S1 = { id: "a0000000-0000-0000-0000-000000000004", role: "student" as const };  // Asha, organizer
const code = async (p: Promise<unknown>) => p.then(() => null, (e) => (e as { code?: string }).code ?? "RAW");
const ev = () => import("@/lib/domain/events");     // dynamic import after the mock

beforeEach(() => { db = freshDb({ seed: true }); });
```
Assertion style: `expect(await code(m.submitEvent(COORD, "d1"))).toBe("BAD_STATE");` and row checks via `db.prepare("SELECT ...").get()`. Cross-owner test: coordinator 2 is `a0000000-0000-0000-0000-000000000002`, expect `NOT_ALLOWED`. `mkEvent(id, status, capacity, start, end)` helper (lines 48-51) inserts events directly; copy it locally, tests/helpers is frozen.

**Wave action tests** (`tests/<role>/actions.test.ts`), from RESEARCH lines 241-253: mock `@/lib/db`, mock `@/lib/auth` `requireRole` (drop the `orig` spread if node import of `next/headers` fails), mock `next/cache` `revalidatePath`, then `await import("@/app/(student)/student/actions")`. Assert `{error}` text contains no `sqlite|constraint|select|table` (same regex as `domain.test.ts` line 461).

---

### `components/ui/status-badge.tsx` + `app/globals.css` + `tests/status.test.ts` (Wave 0 status keys)

**Analog:** itself. Add rows to `STATUS_META` (lines 5-15):
```typescript
full: { label: "Full / Waitlist", Icon: Users, className: "text-status-full-fg bg-status-full-bg border-status-full-fg" },
```
Class strings must be written in full per key (Tailwind v4 detection). Add to `@theme` in `globals.css` (lines 19-36 style):
```css
--color-status-full-fg: #9A3412;
--color-status-full-bg: #FFEDD5;
```
**WARNING for planner (frozen-test conflicts):**
- `tests/status.test.ts` lines 20-25 asserts exactly nine keys, and 27-33 asserts unique labels AND unique icons across all entries; line 36-41 requires every key to have its own `--color-status-<key>-fg/-bg` tokens in CSS. So adding the 8 UI-SPEC keys (registered, waitlisted, todo, doing, done, overdue, clash, lowreg) requires: (1) updating the key list in `status.test.ts`, (2) giving each key its own token pair even where the hex repeats an existing pair (UI-SPEC says "reuse colours": the hex repeats, but token names must be new), (3) unique labels ("Done" is unique vs "Completed"; OK) and unique icons (UI-SPEC icons are distinct from the nine existing).
- `tests/contrast.test.ts` lines 36-40 auto-picks up every `--color-status-*-fg` via regex and checks 4.5:1 against `-bg`; it only needs the tokens, not edits (the UI-SPEC says "extended", but the existing regex already covers it; just bump nothing).
- Verify `BadgeCheck, Hourglass, Circle, CircleDot, CircleCheckBig, AlarmClock, TriangleAlert, TrendingDown` exist in lucide-react 1.60 before committing to the table.

---

### `app/(coordinator|student|admin)/layout.tsx` (guard + shell)

**Analog:** `app/(coordinator)/layout.tsx` lines 1-14 (identical shape in all three). Keep the guard; only fill `navItems`.
```typescript
import type { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireRole('coordinator');
  return (
    <AppShell roleLabel={ROLE_LABEL.coordinator} userName={profile.name} navItems={[]} signOut={signOut}>
      {children}
    </AppShell>
  );
}
```
`navItems: {href, label, icon: ReactNode}[]`; build icons as `<CalendarDays aria-hidden size={20} />` elements in this server layout (icon-as-element per RESEARCH line 103).

---

### Role pages `app/(role)/<role>/**/page.tsx` (async Server Component, read)

**Analog:** `app/(coordinator)/coordinator/page.tsx` lines 1-16.
```typescript
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth";

export default async function Page() {
  const profile = await requireRole('coordinator');   // every page re-checks, not just the layout
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-display font-semibold">Coordinator home</h1>
      ...
```
Extend: `const actor = { id: profile.id, role: profile.role };` then call `@/lib/domain/*` reads. Type-scale classes only: `text-display|heading|body|label`, weights 400/600 (UI-SPEC line 56). `searchParams` is async: `const sp = await searchParams`. Dynamic params: `{ params }: { params: Promise<{ id: string }> }`. Never import `@/lib/db`.

---

### Role `actions.ts` (server action, request-response write)

**Analogs:** RESEARCH Pattern 1 (lines 148-163) and real `app/login/actions.ts` lines 1-35.

**Header + state type** (`login/actions.ts` 1-12):
```typescript
"use server";
import { redirect } from "next/navigation";
export type LoginState = { error?: string; fieldErrors?: { email?: string; password?: string } };
const fd = String(formData.get("email") ?? "").trim();   // parse FormData yourself, trim, return fieldErrors
```
**Action body** (RESEARCH 155-162):
```typescript
export async function submit(eventId: string): Promise<ActionState> {
  const p = await requireRole("coordinator");
  try { await submitEvent({ id: p.id, role: p.role }, eventId); }
  catch (e) { return { error: e instanceof DomainError ? e.message : "Something went wrong on our side. Please try again in a moment." }; }
  revalidatePath("/coordinator"); revalidatePath(`/coordinator/${eventId}`);
  return { ok: true };
}
```
Rules from `login/actions.ts` lines 30-31: `redirect()` throws, keep it outside try/catch. Actor always from `requireRole`, never from form input. Revalidate list and detail paths.

---

### Client components `_components/*.tsx` (Review & Confirm, autosave)

**Analog:** `components/ui/confirm-dialog.tsx` (props lines 6-15: `open, title?, verb, summary, consequence, onConfirm, onCancel, busy`; `showModal()` in `useEffect`), plus RESEARCH Code Example lines 211-235 (`RegisterButton`: `useState(open)`, `useTransition`, `ConfirmDialog`, `aria-live="polite"` region with `Alert`). Copy that example as the template for every irreversible action (submit, register, cancel registration, cancel event, approve, return). Set `open=false` on both cancel and success (pitfall 8). Return-with-reason: `Textarea` as `summary` child, value passed to `reviewEvent` which throws INVALID_INPUT if blank (`events.ts` line 51).

For forms with field errors copy `app/login/login-form.tsx` (`useActionState` + `Field`/`Input`; read it for exact usage before building `CatalogForm`/stepper forms). Autosave: call `saveDraft` action on blur, show text "Saved" + icon in an `aria-live="polite"` span; no localStorage.

---

### Pure helpers `_lib/*.ts` + their tests (utility, transform)

**Analog (for tests):** `tests/status.test.ts` / `tests/contrast.test.ts` use plain `describe/it/expect` with no DB; pure functions (filter, overdue = `due_at < now && status !== 'done'`, utilisation, calendar grouping, `lowreg` rule with constants in one file per UI-SPEC line 193) take explicit `now: Date` args so tests are deterministic. Store/compare times as ISO `...fffZ` strings from `toISOString()`.

---

## Shared Patterns

### Boundary (all route code)
**Source:** `tests/db-boundary.test.ts` lines 15-27. Allowed to import `@/lib/db`/`getDb`: only `lib/db.ts`, `lib/domain/*`, `lib/session.ts`, `lib/auth.ts`. `app/**` and `components/**` importing it fails the test; `getCloudflareContext` only in `lib/db.ts`; no interpolated SQL in `lib/`.

### Actor construction
**Source:** `lib/domain/actor.ts` lines 4-9 and `lib/auth.ts` 41-46. `requireRole(role)` returns `{id, name, role}` or redirects; pass `{ id: p.id, role: p.role }` to domain.

### Error handling
**Source:** `lib/errors.ts` 3-38. Domain throws `DomainError` with human text; actions return `e.message` for `DomainError`, the INTERNAL sentence otherwise. Never show `e.message` of non-DomainError.

### Visibility
**Source:** `lib/domain/events.ts` 13-18 (`VISIBLE`, `visibleWhere`). Students see open/ongoing/completed plus events they registered for (cancelled events appear only with a registration row).

### Test DB harness
**Source:** `tests/helpers/sqlite.ts` `freshDb({seed:true})` (applies `migrations/*.sql` then `seed/seed.sql`), `d1Shim(db)` supports `prepare/bind/run/all/first/batch` only (lines 26-49: `batch` wraps BEGIN/COMMIT; `meta.changes` from `SELECT changes()`). New domain code must stay within these methods (no `exec`, no `.raw()`).

### Seed ids for tests
Coordinators `a0000000-0000-0000-0000-00000000000{1,2}`, admin `...03`, students `...04` (Asha, organizer, 1 overdue task) to `...07`; venue `b0000000-0000-0000-0000-000000000005` used in `domain.test.ts`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Calendar/Agenda/Month primitive (per-role `_components`) | component | transform | No calendar exists; build CSS-grid/agenda list from scratch (no deps), duplicate per role folder, do not share |
| Stepper (`StepRail`, `LiveSummary`) and `<progress>` seat meter | component | event-driven | No multi-step form in repo; closest is `login-form.tsx` for Field wiring |
| `PaneSwitch`, `VenueLanes`, `BarList` (admin) | component | transform | Only admin dashboards, nothing comparable; use `Card` from `components/ui/card.tsx` |
| Server-action tests that import `app/**/actions.ts` | test | request-response | Not done anywhere yet; use RESEARCH lines 241-254 and watch for `next/headers` import failure in node |

## Gaps the planner must resolve (found while mapping)

1. `tests/status.test.ts` (frozen) hard-codes nine keys and per-key CSS tokens, so Wave 0 must edit it alongside `STATUS_META` and `globals.css` (see warning above).
2. `lib/domain` has no `openEvent/advanceEvent`; `submit -> approve -> register` demo story breaks at approved to open (RESEARCH line 276).
3. `getCurrentProfile` lacks `is_organizer`; needs a domain read for D-02 (hide My Tasks), or UI-SPEC line 289 shows the same empty state to non-organizers, which avoids it.
4. `StatusBadge` is typed by `StatusKey`; wave agents cannot pass `registered|todo|...` until Wave 0 lands.

## Metadata

**Analog search scope:** `lib/`, `lib/domain/`, `app/`, `components/ui/`, `tests/`, `tests/helpers/`
**Files read in full:** actor, events, notifications, registrations, tasks, venues, errors, auth, coordinator layout + page, admin layout, status-badge, confirm-dialog (head), sqlite helper, db-boundary, status, contrast, domain tests (1-100), login actions (1-40), globals.css tokens
**Pattern extraction date:** 2026-10-20
