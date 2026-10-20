# Shared vocabulary and layout rules (X4)

Confidence: derived (AI-drafted, not user-tested)

X4 (consistent language and components across roles). Status meanings are copied from `dom-status-vocabulary`; icons and colour families are fixed there and tokens in Phase 3.

## Terms

| Term | Meaning | Used on |
|---|---|---|
| Event | A planned activity with venue, slot, resources and tasks | CO-01..CO-08, ST-01, ST-02, AD-02 |
| Venue | A bookable place | CO-03, AD-05 |
| Slot | A date and time range at a venue; never double-booked | CO-03, AD-04 |
| Resource | An item or service reserved for an event | CO-04, AD-05 |
| Task | A unit of work assigned for an event | CO-05, ST-05 |
| Registration | A student's place at an event | ST-03, ST-04 |
| Waitlist | Queue for a full event | ST-03, ST-04 |
| Approval | Admin decision on a submitted event | AD-02, AD-03 |
| Review & Confirm | The screen before any irreversible action: summary, what will happen, Confirm and Go back | CO-06, ST-03, AD-03 |
| Draft | Coordinator still editing | CO-01 |
| Pending approval | Waiting for admin (canonical label) | CO-01, CO-07, AD-02 |
| Approved | Admin approved, not yet open | CO-01, AD-02 |
| Open | Registration open | ST-01, ST-02 |
| Full | At capacity | ST-01, ST-02 |
| Waitlist (status) | At capacity, joining the queue | ST-02, ST-03 |
| Waitlisted | Registration status: in the queue | ST-04 |
| Registered | Registration status: has a place | ST-04 |
| Ongoing | Happening now | CO-01, ST-01 |
| Completed | Done | CO-08, ST-04 |
| Cancelled | Cancelled | CO-01, ST-04 |
| Returned | Sent back with reason | CO-01, AD-03 |
| To do | Task not started | CO-05, ST-05 |
| In progress | Task under way | CO-05, ST-05 |
| Done | Task finished | CO-05, ST-05 |
| Overdue | Task or item past its due time | CO-05, ST-05, AD-01 |
| Clash | Slot or resource conflict alert | CO-03, AD-03, AD-04 |
| Low registrations | Alert: registrations below expectation | CO-07, AD-01 |

## Layout rules reused across roles

- Page header: title on the left, A-/A/A+ text size control top right.
- Status chip: icon + word + colour name, never colour alone.
- Primary action sits bottom/right of the content.
- Review & Confirm layout: summary, what will happen, then Confirm and Go back.
- Empty state: say what is missing and offer the next action.
- Error message pattern: what happened + what to do next, in plain words.
- Navigation: bottom tab bar on phone, left sidebar on desktop; at most 5 items.

## Not shared

Roles share vocabulary and components, not screens (`dom-flows`).
