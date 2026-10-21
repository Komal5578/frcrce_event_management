# 05-02 SUMMARY: Root Error Handling, Empty States, and Print Stylesheet

**Phase**: 05-cross-cutting
**Plan**: 02
**Status**: Completed
**Requirements covered**: XCUT-03 (designed empty/error states), XCUT-01 (print stylesheet)

## Key Deliverables

1. **`components/ui/page-error.tsx`**:
   - Client component (`"use client"`) rendering human-friendly error copy: `"We could not load this page"` / `"Your work is safe. Check your connection and try again."`
   - Uses existing `Alert` (`variant="error"`, `role="alert"`).
   - "Try again" primary button calling `onRetry`.
   - Optional "Go to my home" link when `homeHref` is provided.
   - Strictly ignores/excludes `error.message` or technical stack traces.

2. **`components/ui/empty-state.tsx`**:
   - Server-safe presentational component.
   - Strictly typed props: `{ title: string; body: string; action?: { label: string; href: string }; icon?: ReactNode }`.
   - Heading, single sentence explanation, and optional action link matching secondary button styling with `min-h-11 min-w-11` touch target.

3. **`app/not-found.tsx`**:
   - Root 404 handler for unknown URLs and forbidden records.
   - Heading: `"We can't find that page"`, description: `"It may have moved, or you may not have access to it."`
   - Dynamically resolves user session via `getCurrentProfile()` inside a try/catch guard:
     - Logged-in users get a `"Go to my home"` link routed via `homeFor(profile.role)`.
     - Logged-out users or database failures fall back safely to `/login` ("Go to sign in").
   - Does not leak the existence of hidden or forbidden IDs.

4. **`app/error.tsx`**:
   - Root error boundary catching runtime errors across layouts.
   - Renders `PageError` with safe retry handling.
   - Strictly suppresses `error.message` and error digests.

5. **`app/global-error.tsx`**:
   - Root fallback error boundary rendered when root layout fails.
   - Own `<html lang="en">` and `<body>` tags.
   - Imports `./globals.css`.
   - Accessible heading and retry button.

6. **`app/globals.css` (@media print)**:
   - Appended cleanly at the end without altering existing tokens.
   - Hides `.skip-link`, `header`, `nav`, and elements marked `[data-no-print]`.
   - Forces clean pure white background with black text for body.
   - Sets `table` with `break-inside: auto`, `tr` with `break-inside: avoid`, and `thead` with `display: table-header-group`.
   - Strips link href annotations (`a[href]::after { content: none !important }`).

## Verification

- `npm run lint` -> Passed (0 errors)
- `npm run typecheck` -> Passed (0 errors)
- `npm run build` -> Passed (compiled 14/14 static pages and all dynamic routes)
- `npx vitest run tests/contrast.test.ts tests/status.test.ts` -> 9 tests passed
