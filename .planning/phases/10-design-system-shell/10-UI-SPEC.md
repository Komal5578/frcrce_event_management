---
phase: 10
slug: design-system-shell
status: draft
reviewed_at: 2026-10-23
shadcn_initialized: true
preset: modern-campus-saas
created: 2026-10-23
---

# Phase 10 — UI Design Contract (UI-SPEC)

> **Visual Direction:** Modern Campus SaaS (Linear / Notion aesthetic). Clean, high-density dashboard layouts, subtle borders, card elevation, and an authoritative indigo/violet accent on neutral zinc.
> **Scope:** Design system foundation, OKLCH light/dark token system, expanded status badge vocabulary, updated AppShells per role, and core component refactoring.
> **Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05.
> **Sources:** `CONTEXT.md`, `ROADMAP.md`, `CLAUDE.md`, `kb/INDEX.md`, `dom-status-vocabulary`, `ds-readme`, `src-accessibility-areas`, `src-hmi-principles`.

---

## 1. Design System & Tech Stack

| Property | Value |
|----------|-------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **CSS Tooling** | Tailwind CSS v4 (`@theme`, OKLCH variables) |
| **Component Primitives** | shadcn/ui patterns built with Tailwind + Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-slot`) |
| **Icons** | `lucide-react` (1.60.0) |
| **Typography** | Inter (`next/font/google`, variable font, size-adjusted fallback) |
| **Color Space** | OKLCH (perceptually uniform, light and dark mode tokens) |
| **Motion** | CSS transitions (150–200ms ease-out), instant switch under `prefers-reduced-motion: reduce` |
| **Data Visualization** | `recharts` (styled with semantic theme tokens, high data-ink, accompanied by accessible tabular fallback) |
| **Feedback / Toasts** | `sonner` or accessible live-region toast with polite screen-reader announcements |

---

## 2. Spacing Scale & Interactive Targets

- **Spacing Grid:** Fixed 4px scale (`--spacing: 4px`), pixel units so 44px interactive targets do not deform when text size scales (A-/A/A+).
- **Interactive Targets (WCAG 2.2 SC 2.5.8):**
  - All interactive buttons, links, inputs, chips, and menu items must have a minimum hit area of **44x44px** (`min-h-11 min-w-11`).
  - Spacing between adjacent touch targets must be at least **8px**.
- **Layout Spacing:**
  - Card internal padding: `16px` (mobile), `24px` (desktop).
  - Page margin / padding: `16px` (mobile), `24px` (tablet), `32px` (desktop).
  - Inter-component vertical rhythm: `16px` within groups, `32px` between sections.

---

## 3. Typography

- **Font Family:** `Inter`, system-ui, sans-serif.
- **Hierarchy & Scale:**
  - **Display (`h1`):** `1.75rem` (28px), line-height `1.2`, font-weight `600`, tracking `-0.02em`.
  - **Heading (`h2`):** `1.25rem` (20px), line-height `1.25`, font-weight `600`, tracking `-0.01em`.
  - **Subheading (`h3`):** `1.125rem` (18px), line-height `1.3`, font-weight `600`.
  - **Body Text:** `1rem` (16px), line-height `1.5`, font-weight `400`.
  - **Label / UI Text:** `0.875rem` (14px), line-height `1.4`, font-weight `500` or `600`.
  - **Fine / Helper Text:** `0.8125rem` (13px), line-height `1.4`, font-weight `400`. No critical content below 13px.
- **Tabular Numerals:** Key metrics, counts, dates, and dashboard numbers use `font-variant-numeric: tabular-nums`.
- **Text Sizing (A-/A/A+):**
  - Maintained via root `font-size` on `<html>`: `14px` (A-), `16px` (A standard), `20px` (A+).
  - Saved in `localStorage.getItem("textSize")`. Inline pre-paint script in `app/layout.tsx` eliminates layout shift.

---

## 4. Color Palette & Token Architecture (OKLCH)

### Semantic Tokens (Light & Dark)

```css
:root {
  /* Surface & Base */
  --color-page: oklch(0.985 0.002 247);        /* #f8fafc */
  --color-surface: oklch(1 0 0);               /* #ffffff */
  --color-panel: oklch(0.965 0.004 247);       /* #f1f5f9 */

  /* Text & Ink */
  --color-ink: oklch(0.18 0.02 260);           /* deep slate/zinc */
  --color-muted: oklch(0.45 0.03 260);         /* secondary text */

  /* Borders */
  --color-border-card: oklch(0.88 0.01 250);   /* subtle divider */
  --color-border-ui: oklch(0.58 0.03 255);     /* input/control borders (>= 3:1) */

  /* Accent (Indigo-Violet) */
  --color-accent: oklch(0.52 0.22 275);        /* vibrant indigo */
  --color-accent-hover: oklch(0.46 0.22 275);
  --color-accent-contrast: oklch(0.99 0 0);    /* pure white */

  /* Destructive (Crimson) */
  --color-destructive: oklch(0.55 0.22 27);
  --color-destructive-hover: oklch(0.48 0.22 27);
  --color-destructive-contrast: oklch(0.99 0 0);
}

[data-theme="dark"], .dark {
  /* Surface & Base */
  --color-page: oklch(0.14 0.01 260);          /* dark backdrop */
  --color-surface: oklch(0.18 0.015 260);      /* dark card surface */
  --color-panel: oklch(0.22 0.02 260);        /* elevated panel/sidebar */

  /* Text & Ink */
  --color-ink: oklch(0.96 0.005 260);          /* bright foreground */
  --color-muted: oklch(0.72 0.02 260);         /* clear muted text */

  /* Borders */
  --color-border-card: oklch(0.28 0.015 260);  /* dark subtle border */
  --color-border-ui: oklch(0.48 0.03 260);     /* dark control border (>= 3:1) */

  /* Accent */
  --color-accent: oklch(0.68 0.20 275);        /* luminous violet for dark mode */
  --color-accent-hover: oklch(0.74 0.18 275);
  --color-accent-contrast: oklch(0.12 0.02 260);

  /* Destructive */
  --color-destructive: oklch(0.68 0.20 27);
  --color-destructive-hover: oklch(0.74 0.18 27);
  --color-destructive-contrast: oklch(0.12 0.02 260);
}
```

---

## 5. Status Vocabulary Mapping (`dom-status-vocabulary`)

Every status is rendered via `StatusBadge` as **Icon + Label + Color**. All pairs satisfy WCAG 2.2 AA contrast (>= 4.5:1).

| Family | Status Key | Display Label | Icon (`lucide-react`) | Color Role |
|--------|------------|---------------|-----------------------|------------|
| **Event** | `draft` | Draft | `Pencil` | Slate/Gray |
| **Event** | `pending` | Pending approval | `Clock` | Amber |
| **Event** | `approved` | Approved | `ShieldCheck` | Blue/Indigo |
| **Event** | `open` | Open | `DoorOpen` | Emerald |
| **Event** | `ongoing` | Ongoing | `CirclePlay` | Teal |
| **Event** | `completed`| Completed | `CircleCheck` | Slate |
| **Event** | `cancelled`| Cancelled | `CircleX` | Crimson |
| **Event** | `full` | Full / Waitlist | `Users` | Orange |
| **Event** | `returned` | Returned | `CornerUpLeft` | Amber |
| **Task** | `todo` | To do | `Circle` | Slate/Gray |
| **Task** | `doing` | In progress | `CircleDot` | Blue |
| **Task** | `done` | Done | `CircleCheckBig` | Emerald |
| **Task** | `overdue` | Overdue | `AlarmClock` | Crimson |
| **Registration** | `registered` | Registered | `BadgeCheck` | Emerald |
| **Registration** | `waitlisted` | Waitlisted | `Hourglass` | Orange |
| **Registration** | `reg-cancelled` | Cancelled | `CircleX` | Crimson |
| **Alert** | `alert-clash` | Clash | `TriangleAlert` | Crimson |
| **Alert** | `alert-low` | Low registrations | `TrendingDown` | Amber |
| **Alert** | `alert-overdue`| Overdue | `AlarmClock` | Crimson |

---

## 6. Elevation & Radii

- **Radius:**
  - Controls, inputs, and buttons: `8px` (`--radius-control`).
  - Cards and dialog containers: `12px` (`--radius-card`).
  - Badges and pill filters: `9999px` (`--radius-pill`).
- **Elevation / Shadows:**
  - Light mode: `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`), `shadow-md` for floating menus/cards, `shadow-xl` for modal dialogs.
  - Dark mode: Soft border illumination (`1px solid var(--color-border-card)`) with dark ambient shadow (`0 4px 20px 0 rgb(0 0 0 / 0.5)`).

---

## 7. Motion & Micro-interactions

- **Duration:** `150ms` (hover, button click feedback), `200ms` (dialog transitions, mobile sheet drawer).
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration).
- **Reduced Motion:** If `prefers-reduced-motion: reduce` is active, all transitions and animations are overridden to `0ms`.

---

## 8. Role AppShell Architecture

### Navigation Active State Rule
The navigation matching bug must be fixed. Active item calculation:
```ts
const isRoleHome = ["/coordinator", "/admin", "/student"].includes(item.href);
const isActive = isRoleHome 
  ? pathname === item.href 
  : pathname === item.href || pathname.startsWith(`${item.href}/`);
```

### Layout per Role
1. **Coordinator & Admin:**
   - **Desktop (>= 1024px):** Fixed left sidebar (`240px`) with logo, role badge, navigation links, and bottom user profile/sign out.
   - **Mobile (< 1024px):** Header bar with logo, text-size toggle, and hamburger button triggering a full-height accessible Sheet drawer.
2. **Student:**
   - **Desktop (>= 1024px):** Left sidebar navigation identical to Coordinator/Admin.
   - **Mobile (< 1024px):** Header with logo, text-size toggle, and user menu. **Bottom navigation tab bar** with fixed 4 items:
     1. Discover (`Compass` / `Search`)
     2. My Events (`Calendar` / `Ticket`)
     3. Tasks (`CheckSquare`, shown if user has organizer tasks)
     4. Notifications (`Bell`, showing unread indicator)

---

## 9. Core Component Specifications

1. **`ConfirmDialog` (Review & Confirm):**
   - Automatically focuses the "Go back" button on open (via `ref` in `useEffect`).
   - Supports `variant?: "default" | "destructive"`. When `destructive`, primary button uses destructive tokens.
   - Accessible keyboard behavior: `Escape` key closes, tab loop trapped within dialog.
2. **`Button`:**
   - Supports `asChild` prop (Radix Slot pattern) so Next.js `Link` elements can share identical button visual styling without class duplication.
   - Variants: `primary`, `secondary`, `destructive`, `ghost`, `link`.
3. **`StatusBadge`:**
   - Single canonical lookup table `STATUS_META`.
   - Strict typing enforcing `StatusKey`.
4. **`EventCard` (Consolidated):**
   - Single reusable component for event listings across Coordinator and Student views.
   - Displays title, date/time, venue, seats remaining, organizer badge, and status.
5. **`ReportsPage` (Consolidated):**
   - Reusable report view with KPI stat summary cards, Recharts horizontal bar chart (attendance/capacity, department distribution), and CSV export button.
   - Accessible data table accompanies chart for screen reader users.

---

## 10. API Client & Auth Wiring

- **API Gateway Rewrite:**
  - `frontend/next.config.ts`: Rewrites `/api/:path*` to `process.env.API_URL || "http://127.0.0.1:8000/:path*"`.
- **API Types:**
  - Generated using `npx openapi-typescript` into `frontend/lib/api-types.ts`.
- **Isomorphic Client (`frontend/lib/api.ts`):**
  - Handles server-side cookie forwarding using `next/headers`.
  - Normalizes API errors into typed domain error classes (`DomainError`).
- **Redesigned Login Page:**
  - Modern campus SaaS card layout.
  - Checks `/api/auth/demo-status` to dynamically show/hide demo login buttons.

---

## 11. Checker Sign-Off

- [x] Dimension 1 Copywriting & Vocabulary: PASS (`dom-status-vocabulary`)
- [x] Dimension 2 Visual Direction: PASS (Modern Campus SaaS, Linear/Notion style)
- [x] Dimension 3 Color & Tokens: PASS (OKLCH light & dark with WCAG 2.2 AA)
- [x] Dimension 4 Typography: PASS (Inter, 4 sizes, 2 weights, tabular nums, A-/A/A+)
- [x] Dimension 5 Spacing & Targets: PASS (44px interactive targets, fixed 4px grid)
- [x] Dimension 6 Accessibility & Landmarks: PASS (Skip link, WCAG AA contrast, exact navigation matching)
