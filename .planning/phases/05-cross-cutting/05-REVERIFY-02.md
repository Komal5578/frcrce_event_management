# 05-REVERIFY-02: Error and Empty State Conventions in Merged Phase 4

_Generated during Plan 05-02 execution (Phase 5 Wave 1)_

## States

### Role `error.tsx` Files

1. **`app/(admin)/admin/error.tsx`**:
   - Destructures prop: `{ reset }` (signature: `{ error: Error; reset: () => void }`).
   - `error.message` printed: No. Uses fixed copy: `"We could not load the dashboard numbers."` / `"Your data is safe. Try again in a moment."`.

2. **`app/(coordinator)/coordinator/error.tsx`**:
   - Destructures prop: `{ reset }` (signature: `{ error: Error; reset: () => void }`).
   - `error.message` printed: No. Uses fixed copy: `"We could not load your events"` / `"Your work is safe. Check your connection and try again."`.

3. **`app/(student)/student/error.tsx`**:
   - Destructures prop: `{ reset }` (signature: `{ error: Error; reset: () => void }`).
   - `error.message` printed: No. Uses fixed copy: `"We could not load events. Check your connection and try again."`.

All 3 role `error.tsx` files uniformly use the `reset` prop and strictly avoid printing `error.message` or stack traces.

### Empty States Across Views

- Before Phase 5 Plan 02, empty states across role views used inline custom markup or simple `<p>` tags (e.g. `BarList` in admin used `<p className="text-body text-muted">{empty}</p>`, student views had inline paragraphs/cards).
- Count of inline empty-state patterns: 6 across role pages.
- With `EmptyState` created in `components/ui/empty-state.tsx`, these can be standardized uniformly in Plan 05 without duplicating copy or layout structures.
