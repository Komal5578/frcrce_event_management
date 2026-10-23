# Phase 10: Design System & App Shell - Research

**Researched:** 2026-10-23
**Domain:** Next.js (App Router) + Tailwind v4 + OKLCH design tokens (light/dark) + shadcn/ui + role shells + typed API client
**Confidence:** HIGH on visual architecture, accessibility constraints (WCAG 2.2 AA), contrast testing, and API proxy rewrites

<user_constraints>
## User Constraints (from CONTEXT.md, ROADMAP.md, and CLAUDE.md)

### Locked Decisions
- **Visual direction:** "Modern campus SaaS" in the spirit of Linear / Notion. Clean dashboard look with cards + calendar layout.
- **Color & tokens:** OKLCH palette for **both light and dark** themes. Confident accent (indigo → violet) on a neutral zinc foundation. 12px card radius with soft elevation.
- **Typography:** Inter or Geist type scale. Maintain text-size control (A-/A/A+ with 14px / 16px / 20px root size) and pre-paint script. 44px interactive targets must hold across all text sizes (spacing in px).
- **Motion:** 150–200ms motion that strictly respects `prefers-reduced-motion: reduce`.
- **Contrast:** WCAG 2.2 AA compliant. `tests/contrast.test.ts` must pass in **both** light and dark themes (text pairs >= 4.5:1, UI borders >= 3:1, status badges >= 4.5:1).
- **Status Vocabulary:** Canonical `StatusBadge` covering all status families (`dom-status-vocabulary`: event, task, registration, alert). Icon + word + color always; never color alone.
- **Dialogs:** `ConfirmDialog` must focus "Go back" first by default (prevent accidental destructive clicks) and provide a `destructive` action variant.
- **Role Shells (`AppShell`):**
  - Coordinator and Admin: desktop sidebar + mobile accessible sheet (slide-over).
  - Student: desktop sidebar + mobile **bottom tab bar** (Discover, My Events, Tasks*, Notifications) per IA.
  - Active link fix: exact match for role home link (`/coordinator`, `/admin`, `/student`) so home isn't marked current on every subpage.
- **De-duplication:** Consolidate duplicates: one `ReportsPage` (with Recharts styled for A4/P9), one `EventCard`, one toast/flash system, one calendar component, and reusable button link variants.
- **Security:** `/design` gallery must sit behind admin authentication or be removed in production.
- **API Wiring:** `next.config.ts` rewrites `/api/:path*` to `${API_URL}/:path*` (first-party session cookie, no CORS). `lib/api.ts` forwards cookies in server components. `npm run gen:api` via `openapi-typescript` creates `lib/api-types.ts`. Login displays demo buttons only when backend reports demo mode is enabled.
- **KB integrity:** Cite kb ids (`dom-status-vocabulary`, `ds-readme`, `src-accessibility-areas`, `src-hmi-principles`, `adr-001-stack`). Run `node kb/tools/build-index.mjs` if kb files are touched.

### Claude's Discretion
- Exact OKLCH coordinate selection for tokens (ensuring WCAG AA mathematical compliance).
- Component implementation details for mobile navigation (Sheet and bottom tab bar).
- Toast library selection (`sonner` or lightweight accessible live-region toast).
- Radix UI primitive integration for headless behaviors.

### Deferred Ideas (OUT OF SCOPE)
- Phase 11 role screen rebuilding (ST-01..06, CO-01..08, AD-01..06) - Phase 10 builds the design system, shells, login, and shared components.
- Phase 12 deployment infrastructure (EC2, Vercel, DNS, Caddy).
- Phase 13 user testing and research evidence.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | A user-approved UI-SPEC sets the visual direction (type, OKLCH palette in light and dark, radius, elevation, motion, charts). | 10-UI-SPEC.md contract, Linear/Notion modern campus SaaS tokens, dark theme specification |
| UI-02 | shadcn/ui components on the tokens, with StatusBadge covering all status families. The contrast test passes AA in both themes (X1). | OKLCH mathematical luminance & WCAG contrast calculation in `tests/contrast.test.ts`, expanded `STATUS_META` |
| UI-03 | ConfirmDialog focuses "Go back" first and has a destructive variant (X2). | Focus management on mount, `variant="destructive"` support on confirm button |
| UI-04 | Role AppShells: sidebar + sheet for Coordinator/Admin, bottom tab bar for Student, correct current-nav marking, A-/A/A+ kept (X3). | `app-shell.tsx` navigation matcher fix, Sheet primitive for mobile drawer, fixed bottom nav for Student view |
| UI-05 | The login and typed API client (openapi-typescript, `/api/*` rewrite, first-party cookie) work against FastAPI. | Next.js rewrite configuration, `openapi-typescript` script, cookie-forwarding fetcher in `lib/api.ts`, demo-gate aware login screen |
</phase_requirements>

## Visual System Architecture ("Modern Campus SaaS")

### 1. OKLCH Color Palette & Semantic Mapping
The system uses OKLCH color spaces for perceptual uniformity, vibrant accents, and clean contrast steps:
- **Base:** Neutral Zinc scale.
  - Light mode: Page `oklch(0.985 0.002 247)` (#f8fafc equivalent), Surface `oklch(1 0 0)` (#ffffff), Panel `oklch(0.965 0.004 247)` (#f1f5f9), Border UI `oklch(0.52 0.02 250)`, Border Card `oklch(0.85 0.01 250)`, Ink `oklch(0.18 0.02 260)`, Muted `oklch(0.45 0.03 260)`.
  - Dark mode: Page `oklch(0.14 0.01 260)` (#090a0f), Surface `oklch(0.18 0.015 260)` (#12141a), Panel `oklch(0.22 0.02 260)` (#1a1d26), Border UI `oklch(0.40 0.02 260)`, Border Card `oklch(0.28 0.015 260)`, Ink `oklch(0.96 0.005 260)` (#f1f5f9), Muted `oklch(0.72 0.02 260)`.
- **Accent:** Confident Indigo / Violet (`oklch(0.55 0.22 275)` light, `oklch(0.68 0.20 275)` dark).
- **Destructive:** Bright crimson (`oklch(0.55 0.22 27)` light, `oklch(0.65 0.22 27)` dark).
- **Status families:** Each has explicit fg/bg tokens defined for both light and dark, verified to exceed 4.5:1 ratio:
  - Draft: Slate/Gray
  - Pending approval / Returned / Lowreg: Amber
  - Approved / Doing: Blue/Indigo
  - Open / Registered / Done: Emerald/Green
  - Ongoing: Teal
  - Completed: Slate
  - Cancelled / Overdue / Clash: Red/Crimson
  - Full / Waitlisted: Orange

### 2. Contrast Test Upgrade (`tests/contrast.test.ts`)
The v1 contrast test matched `#RRGGBB` hex strings from `globals.css`. With Tailwind v4 and OKLCH:
1. Tokens are declared in CSS variables for both `:root` (light) and `[data-theme="dark"]` / `.dark`.
2. The test converts OKLCH values to standard linear sRGB relative luminance ($Y = 0.2126 R + 0.7152 G + 0.0722 B$) to compute standard WCAG 2.2 relative contrast.
3. Light and dark sets are evaluated against the required ratios:
   - Text on background >= 4.5:1
   - Status badge fg on bg >= 4.5:1
   - UI border on background >= 3:1

### 3. Navigation & AppShell Fixes
- **Exact Path Matching:**
  The current check `pathname === item.href || pathname.startsWith(item.href + "/")` incorrectly matches root role paths like `/coordinator` against `/coordinator/events`. The fix checks:
  ```ts
  const isExactRoot = ["/coordinator", "/admin", "/student"].includes(item.href);
  const current = isExactRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  ```
- **Student Mobile Bottom Tab Bar:**
  On screens `< 1024px`, Student shell renders a fixed bottom navigation bar with 4 primary targets (Discover, My Events, Tasks [if organizer], Notifications). Target height >= 44px with label and icon.
- **Coordinator & Admin Mobile Drawer:**
  On `< 1024px`, a top bar with a hamburger button opens an accessible Sheet dialog (overlay + sliding panel) containing the navigation items.

### 4. Component Refactoring & Consolidation
- **ConfirmDialog:** Add `ref` auto-focus to the "Go back" button on open. Add `variant?: "default" | "destructive"` which styles the primary action button accordingly.
- **Button:** Support polymorphic `asChild` rendering (using Radix Slot pattern or simple link option) so `Link` components share button styles without copied class strings.
- **De-duplication:**
  - Reports: Create `components/reports/reports-view.tsx` supporting date filters, metrics cards, Recharts bar charts (with accessible data table alternative for screen readers), and CSV export.
  - EventCard: Create `components/events/event-card.tsx` used across Discover, My Events, and Coordinator list views.

### 5. API Client & OpenAPI Typing
- `next.config.ts`: Add `rewrites()` rule pointing `/api/:path*` to `process.env.API_URL || "http://127.0.0.1:8000/:path*"`.
- `openapi-typescript`: Add to `package.json` devDependencies. Add `"gen:api": "openapi-typescript http://127.0.0.1:8000/openapi.json -o lib/api-types.ts"` (and support fallback to a local schema).
- `lib/api.ts`: A client/server isomorphic fetcher that automatically includes cookies, checks response status, and throws structured `ApiError` mapping domain error markers (`VENUE_CLASH`, `EVENT_FULL`, `RESOURCE_SHORT`, `BAD_STATE`, `NOT_ALLOWED`).
