# Phase 10: Design System & App Shell (context brief)

Requirements: UI-01..05. Start with `gsd-ui-phase` to write the UI-SPEC, and get the user's approval before building screens.

## Visual direction (user: "modern campus SaaS")
- Clean dashboard look in the spirit of Linear/Notion, with a cards + calendar layout.
- Inter or Geist type scale. A confident accent (indigo→violet) on a neutral zinc base.
- OKLCH tokens for **light and dark** themes, 12px card radius with soft elevation.
- 150–200ms motion that respects `prefers-reduced-motion`.
- Recharts styled for Reports (A4/P9).

## Keep from v1 (re-themed, not rewritten)
- `components/ui/status-badge.tsx`: one `STATUS_META` map; add the task, registration and alert families.
- `text-size-control.tsx` and the pre-paint script in `app/layout.tsx` (A-/A/A+), skip link, print CSS.
- `tests/contrast.test.ts`: re-point it at the new tokens and check AA in **both** themes.
- 44px targets at every text size (spacing in px).

## Fix (audit)
- **AppShell** `aria-current`: v1 `startsWith(href + "/")` marks home current everywhere. Use an exact match for the role home link.
- **Mobile nav:** Coordinator/Admin get a sidebar plus a shadcn Sheet on mobile; Student gets a **bottom tab bar** (Discover, My Events, Tasks*, Notifications).
- **ConfirmDialog:** initial focus on "Go back", plus a `destructive` button variant (v1 proposal 04-02 #1).
- **Merge duplicates:** one `ReportsPage`, one `EventCard`, one `Flash`/toast (sonner), one calendar, a Button `asChild`/link variant instead of the copied class string.
- `/design` sits behind admin auth, or is deleted.

## API wiring
- `next.config` `rewrites`: `/api/:path*` → `${API_URL}/:path*`.
- `lib/api.ts` forwards the cookie in server components.
- `npm run gen:api` (openapi-typescript) creates `lib/api-types.ts`.
- Redesigned login with demo buttons only when the API reports demo mode.
