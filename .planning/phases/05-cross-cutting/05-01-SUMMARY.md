# 05-01 SUMMARY: Pure CSV Utility and Domain Modules (Reports & Alerts)

**Phase**: 05-cross-cutting
**Plan**: 01
**Status**: Completed
**Requirements covered**: XCUT-01 (CSV export & reports read model), XCUT-02 (computed alerts domain)

## Key Deliverables

1. **`lib/csv.ts`**:
   - Pure RFC 4180 CSV serializer with zero external dependencies.
   - UTF-8 BOM (`\uFEFF`) prefix to prevent Microsoft Excel character mangling.
   - CRLF (`\r\n`) line terminators.
   - Spreadsheet injection mitigation: prepends single quote (`'`) to any cell beginning with `= + - @ \t \r`.
   - Double quotes escaped via standard RFC 4180 doubling (`""`).
   - Null / undefined represented as empty cells without quotation.

2. **`tests/xcut/csv.test.ts`**:
   - 12 automated unit tests covering RFC 4180 parsing, quotes, delimiters, BOM, injection prefixes, and round-tripping.

3. **`lib/domain/reports.ts`**:
   - `buildReport(actor, rawFilters, now)`: Role-scoped read model. Rejects `student` role with `NOT_ALLOWED`. Coordinators see only their own events.
   - `parseFilters(raw)`: Whitelist validation for status and ISO date formats.
   - `listOverdueTasksForActor(actor, now)`: Returns overdue tasks scoped strictly to the actor's permitted events.
   - No template-literal SQL — prepared statements with parameterized binds only.
   - No PII or registrant names/emails exposed.

4. **`tests/xcut/reports.test.ts`**:
   - 21 automated integration tests with SQLite d1Shim.
   - Tests role authorization, coordinator event isolation, venue clash triggers, CSV round-trip equality, and overdue task access controls.

5. **`lib/domain/alerts.ts`**:
   - Pure, clock-free computed alerts for all roles.
   - `computeAlerts({ role, events, tasks, bookings, now, hrefFor })`: Evaluates clashes, overdue tasks, and low registrations.
   - Role defensive isolation: students receive only their own overdue tasks, coordinators receive clashes only for their own events, admins receive all alerts.
   - Overdue tasks grouped per event.
   - `splitAlerts(items, limit)`: Splitting helper for preview/collapsible display.

6. **`tests/xcut/alerts.test.ts`**:
   - 14 automated unit tests covering alert computation, ordering, grouping, role-based visibility, and pagination split.

## Verification

- `npx vitest run tests/xcut` -> 47 tests passed
- `npx vitest run tests/db-boundary.test.ts` -> 4 tests passed
- `npm run typecheck` -> passed (0 errors)
