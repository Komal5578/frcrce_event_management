# 05-REVERIFY-01: Phase 4 Contract & Domain Verification

_Generated during Plan 05-01 execution (Phase 5 Wave 1)_

## Findings & Baseline Checks

1. **Phase 4 Commits & Files**:
   - Phase 4 files exist and baseline state was verified.
   - All tests passing across existing domain and phase 4 test suites.

2. **Dashboard Stats Computation**:
   - **Admin dashboard stats** (`eventsThisMonth`, `openCount`, `pendingCount`, `venues`, `departments`, `lowReg`, `overdueCount`) are computed via the pure function `stats(events, venues, tasks, now)` located in `app/(admin)/admin/_lib/dashboard.ts`.
   - **Coordinator glance strip / monitor stats** (`seatPercent`, `waitlist`, `lowReg`, `overdue`, `tasksDone`, `next`) are computed via the pure function `monitorModel(ev, tasks, now)` located in `app/(coordinator)/coordinator/_lib/monitor.ts`.
   - Both are pure functions taking an explicit `now: Date` parameter without internal clock reads or direct DB queries.

3. **Domain Exports & Signatures**:
   - `lib/domain/views.ts`:
     - `listEventsWithSeats(actor: Actor): Promise<EventView[]>`
     - `getEventDetail(actor: Actor, eventId: string): Promise<EventView>`
     - `type EventView`
   - `lib/domain/admin.ts`:
     - `listBookings(actor: Actor, from: string, to: string): Promise<BookingRow[]>`
     - `flagConflicts(rows: Omit<BookingRow, "conflict">[]): BookingRow[]`
     - `type BookingRow`
   - `lib/domain/allocations.ts`:
     - `listAllocations(actor: Actor, eventId: string): Promise<AllocationRow[]>`
     - `setAllocation(actor: Actor, eventId: string, resourceId: string, quantity: number): Promise<void>`
     - `listEventTasks(actor: Actor, eventId: string): Promise<TaskRow[]>`
     - `listCoordinatorTasks(actor: Actor): Promise<TaskRow[]>`
     - `createTask(actor: Actor, eventId: string, t: { title: string; assigneeId: string; dueAt: string }): Promise<string>`
     - `type AllocationRow`, `type TaskRow`
   - `lib/domain/people.ts`:
     - `listStudents(actor: Actor): Promise<StudentRow[]>`
     - `myProfile(actor: Actor): Promise<MyProfile>`
     - `listMyRegistrations(actor: Actor): Promise<MyRegistration[]>`
     - `listMyTasks(actor: Actor): Promise<MyTask[]>`
     - `type StudentRow`, `type MyProfile`, `type MyRegistration`, `type MyTask`
