# Coordinator wireframes (CO-01..CO-08)

Confidence: derived (AI-drafted, not user-tested). All names, dates and numbers are illustrative placeholders, no real people.

Desktop-first, left sidebar of 4 nav items (D-08). Screen ids and req ids come from `docs/ia/coordinator.md`.

Legend (greyscale low-fi; Phase 3 picks real icons and tokens from `dom-status-vocabulary`):

- Icon proxies: Draft `~`, Pending approval `!`, Approved `+`, Open `o`, Full/Waitlist `=`, Ongoing `>`, Completed `*`, Cancelled `x`, Returned `<`, Clash `#`, Overdue `!`.
- Status chip format: `[<icon> <Word> - <colour name>]`. Colours from `dom-status-vocabulary`: Draft grey, Pending approval amber, Approved blue, Open green, Ongoing teal, Completed slate, Cancelled red, Returned amber. Task colours (To do grey, In progress blue, Done slate, Overdue red) and Clash red are assumed until Phase 3 tokens.
- Buttons are `[ Label ]` and filter chips `[Label]`; they are not status chips. Every target is 44px.
- `A- A A+` is the text size control, top right of every page header.
- Irreversible actions go through Review & Confirm (X2).

## CO-01 My Events (C1, C6, X1, X3)

```
+--------------------------------------------------------------+
| My Events                                       A-  A  A+    |
+-----------+--------------------------------------------------+
| > My Events| [ + New event ]        [All] [Mine] [Needs me]   |
|   Calendar |--------------------------------------------------|
|   Tasks    | Tech Fest 2026   12 Mar  Seminar Hall            |
|   Notifs(2)|   [! Pending approval - amber]    [ View ]       |
|            | Photo Walk       02 Apr  Main Lawn               |
|            |   [~ Draft - grey]                [ Continue ]   |
|            | Quiz Night       20 Feb  Room 204                |
|            |   [o Open - green]  38/60 seats  [ View ]        |
|            |   [! Low registrations - amber]                  |
+-----------+--------------------------------------------------+
```

Notes: sorted by next date; statuses and "needs attention" alerts are already computed, nothing typed to see them.
Empty: "No events yet. Start one from a template." with [ + New event ].
Error: "We could not load your events. Your work is safe. Check your connection and try again." with [ Try again ].
Next: CO-02, CO-07

## CO-02 New Event: template and details (C1, X4)

```
+--------------------------------------------------------------+
| New event - step 1 of 4                         A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | Start from: [Seminar] [Workshop] [Fest] [Blank]  |
| Calendar   | Title      [ Seminar - Dept of Computer Sci ]    |
| Tasks      | Department [ Computer Science (yours)       ]    |
| Notifs     | Expected   [ 60 ]  (from last Seminar)           |
|            | Date       [ 12 Mar 2026 ]  Time [ 10:00-12:00 ]  |
|            |                          [ Go back ] [ Next ]    |
+-----------+--------------------------------------------------+
```

Notes: prefilled from the template and the signed-in coordinator: department, expected size, default duration, standard task list.
Next: CO-03

## CO-03 Venue and slot picker (C2, X5)

```
+--------------------------------------------------------------+
| Pick a venue - 12 Mar, 10:00-12:00              A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | Free for your slot (fits 60+):                   |
| Calendar   |  ( ) Seminar Hall     capacity 120   free        |
| Tasks      |  (o) Room 204         capacity  70   free        |
| Notifs     | Not available:                                   |
|            |  Main Auditorium  capacity 300                   |
|            |   [# Clash - red] Annual Day, 09:00-13:00        |
|            |   Pick another venue or another time slot.       |
|            |                          [ Go back ] [ Next ]    |
+-----------+--------------------------------------------------+
```

Notes: only free venues can be chosen, capacity beside each; an unavailable venue is listed with the reason, never hidden silently. Clashes are also impossible to save (`dom-domain-model`).
Next: CO-04

## CO-04 Resources (C3)

```
+--------------------------------------------------------------+
| Resources                                       A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | Suggested for a Seminar (tick to reserve):       |
| Calendar   |  [x] Projector         1 free                    |
| Tasks      |  [x] Microphone        2 free                    |
| Notifs     |  [ ] Laptop            0 free  (all booked)      |
|            |  Other: [ add resource ]                         |
|            |                          [ Go back ] [ Next ]    |
+-----------+--------------------------------------------------+
```

Notes: defaults come from the template; an unavailable resource is shown with "all booked", not hidden.
Next: CO-05

## CO-05 Tasks (C4)

```
+--------------------------------------------------------------+
| Tasks for Tech Fest 2026                        A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | Task            Owner      Due     Status        |
| Calendar   | Book poster     Asha K.    05 Mar  [~ To do - grey]|
| > Tasks    | Print passes    Ravi P.    08 Mar  [> In progress - blue]|
| Notifs     | Test mic        Meera S.   11 Mar  [! Overdue - red]|
|            | [ + Add task ]                                   |
|            |                          [ Go back ] [ Next ]    |
+-----------+--------------------------------------------------+
```

Notes: standard tasks prefilled from the template; owner picked from students already in the department. Task chips use the shared vocabulary (X4).
Next: CO-06

## CO-06 Review and Confirm (C5, C7, X2)

```
+--------------------------------------------------------------+
| Review and confirm                              A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | Summary                                          |
| Calendar   |  Seminar, 12 Mar 10:00-12:00, Room 204, 60 seats |
| Tasks      |  Projector, Microphone; 3 tasks assigned         |
| Notifs     | What will happen                                 |
|            |  The Admin is asked to approve. You can still    |
|            |  edit until they decide.                         |
|            |            [ Go back ]  [ Confirm and submit ]   |
+-----------+--------------------------------------------------+
After Confirm: "Sent for approval. We will tell you here when the Admin decides."
```

Notes: cancel variant (C7): summary of the event, "what will happen": the event is cancelled, the venue is released, and registrants are told in-app; buttons [ Go back ] and [ Confirm cancel ], then plain feedback "Event cancelled. 38 registrants have been notified."
Next: CO-07

## CO-07 Submitted / Monitor (C5, C6, X1)

```
+--------------------------------------------------------------+
| Tech Fest 2026                                  A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | [! Pending approval - amber]  sent 2 days ago    |
| Calendar   | Approval progress:  Submitted > Admin > Open     |
| Tasks      | Registrations: 0 / 60                            |
| Notifs     | Tasks: 1 done, 1 overdue [! Overdue - red]       |
|            | [! Low registrations - amber] 12 of 60 so far    |
|            | [ Edit ] [ Cancel event ]       [ View summary ] |
+-----------+--------------------------------------------------+
```

Notes: status and alerts come from the system; if the Admin returns the event the chip becomes `[< Returned - amber]` with the reason shown first.
Next: CO-08, CO-06

## CO-08 Event summary (C6)

```
+--------------------------------------------------------------+
| Event summary - Quiz Night                      A-  A  A+    |
+-----------+--------------------------------------------------+
| My Events  | [* Completed - slate]  20 Feb, Room 204          |
| Calendar   | Registered 52 / 60     Tasks done 5 / 5          |
| Tasks      | Venue and resources released                     |
| Notifs     |                              [ Back to My Events ]|
+-----------+--------------------------------------------------+
```

Notes: read-only recap of numbers the system already holds.
Next: end
