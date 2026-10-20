---
phase: 03-foundation
plan: 01
subsystem: infra
tags: [nextjs, tailwind-v4, vitest, design-tokens, wcag]
requires: []
provides:
  - Hand-written Next 16 + Tailwind v4 + Vitest scaffold with lint/typecheck/test/build all green
  - app/globals.css token source of truth (colours, 9 status pairs, 4 text sizes, 4px spacing, focus ring)
  - tests/contrast.test.ts parsing globals.css
  - Real commands recorded in CLAUDE.md
affects: [03-02, 03-03, 03-04, 03-05, phase-04]
tech-stack:
  added: [next 16.4.2, react 19.3.1, tailwindcss 4.3.3, vitest 5.0.5, lucide-react 1.60.0, "@supabase/ssr 0.12.7", "@supabase/supabase-js 2.118.0", "@electric-sql/pglite 0.5.10", supabase CLI 2.121.0]
  patterns: [CSS-first @theme tokens, px spacing + rem text, pre-paint text-size script]
key-files:
  created: [package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, vitest.config.ts, .env.example, app/layout.tsx, app/globals.css, app/page.tsx, tests/contrast.test.ts]
  modified: [.gitignore, CLAUDE.md]
key-decisions:
  - "globals.css is the only token source; no tokens.ts (YAGNI)"
  - "--spacing: 4px so 44px targets hold at A-/A/A+"
requirements-completed: [FOUND-01, FOUND-02]
duration: ~25min
completed: 2026-10-20
---

# Phase 3 Plan 01: Scaffold, tokens and contrast check Summary

Hand-written Next 16 / Tailwind v4 / Vitest scaffold with px-spacing design tokens in `app/globals.css` and a Vitest contrast check that parses that CSS (`dom-status-vocabulary`, `src-accessibility-areas`, `adr-001-stack`).

## Tasks
1. Config + deps: 82d878f
2. Layout, tokens, text-size script: 1170985
3. Contrast test + CLAUDE.md commands: 1a38cf8

## Verification
`npm run lint`, `typecheck`, `npm test` (4 tests), `npm run build` all exit 0. Negative check: setting `--color-muted` to #999999 failed the test (2.85 < 4.5); reverted.

Contrast table (computed from globals.css; computed, not user-tested):

| pair | ratio | needed |
|---|---|---|
| ink on surface | 17.85 | 4.5 |
| ink on panel | 16.30 | 4.5 |
| muted on surface | 7.58 | 4.5 |
| muted on panel | 6.92 | 4.5 |
| white on accent | 9.93 | 4.5 |
| accent on surface | 9.93 | 4.5 |
| white on destructive | 6.47 | 4.5 |
| border-ui on surface | 4.76 | 3 |
| status draft | 9.37 | 4.5 |
| status pending | 8.15 | 4.5 |
| status approved | 7.15 | 4.5 |
| status open | 6.49 | 4.5 |
| status ongoing | 6.73 | 4.5 |
| status completed | 8.40 | 4.5 |
| status cancelled | 6.80 | 4.5 |
| status full | 6.38 | 4.5 |
| status returned | 8.15 | 4.5 |

Plan 03-05 (or whoever owns `kb/design-system/README.md`) should paste this table there; this plan did not touch kb.

## Deviations from Plan

**1. [Rule 3 - Blocking] Vitest 5 uses Vite 8 (oxc), not esbuild.** `esbuild: { jsx: "automatic" }` failed typecheck. Used `oxc: { jsx: { runtime: "automatic" } }`. Commit 1170985.

**2. [Rule 3 - Blocking] Next rewrote tsconfig on build** (jsx -> react-jsx, added `.next/dev/types/**/*.ts`). Kept Next's values. Commit 1170985.

**3. [Rule 1 - lint] postcss.config.mjs** anonymous default export warning; assigned to a `config` const. Commit 1170985.

**4. TypeScript pinned to 5.9.3** (latest is 7.0.2; plan says 5.x). Other versions pinned as exact latest-compatible: react/react-dom 19.3.1, eslint 10.13.0, eslint-config-next 16.4.2.

## Issues / notes
- Package legitimacy: `npm view` repo URLs for next, @supabase/ssr, pglite, supabase, lucide-react, vitest, tailwindcss, supabase-js all match the expected upstream repos; no postinstall on any of them.
- `npm install` warned that transitive `unrs-resolver` has a postinstall (not in allowScripts); not approved, lint/build work without it.
- `npm audit` reports 5 high (e.g. `braces` ReDoS, transitive dev dependency). Out of scope, not fixed.
- Vitest prints a Vite warning that vitest.config.ts is ESM loaded as CJS (no `"type": "module"`); harmless, left as is.
- console.table output is hidden by the default reporter; use `npx vitest run tests/contrast.test.ts --disableConsoleIntercept` to see it.

## Known Stubs
`app/page.tsx` is a placeholder link to /login (plan 03-04 replaces it, as planned).

## Self-Check: PASSED
