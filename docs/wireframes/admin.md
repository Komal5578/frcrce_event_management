# Admin wireframes (AD-01..AD-06)

Confidence: derived (AI-drafted, not user-tested). All names, dates and numbers are illustrative placeholders, no real people.

Desktop-first, left sidebar of 5 nav items (D-08). Screen ids and req ids come from `docs/ia/admin.md`. AD-01 Dashboard is the Admin home, shown above Approvals and not a nav item (D-06).

Legend (greyscale low-fi; Phase 3 picks real icons and tokens from `dom-status-vocabulary`):

- Icon proxies: Pending approval `!`, Approved `+`, Open `o`, Returned `<`, Clash `#`, Overdue `!`.
- Status chip format: `[<icon> <Word> - <colour name>]`. Colours from `dom-status-vocabulary`: Pending approval amber, Approved blue, Open green, Returned amber. Clash red and Overdue red are assumed until Phase 3 tokens.
- Buttons are `[ Label ]` and filter chips `[Label]`; they are not status chips. Every target is 44px.
- `A- A A+` is the text size control, top right of every page header.
- Irreversible actions go through Review & Confirm (X2).

## AD-01 Dashboard (A4, X1)

```
+--------------------------------------------------------------+
| Dashboard                                       A-  A  A+    |
+-------------+------------------------------------------------+
| Approvals(3)| Events this month: 14   Pending approvals: 3   |
| Calendar    | [! Pending approval - amber]  [ Review 3 ]     |
| Venues & Res| Utilisation: Seminar Hall 70%  Room 204 45%    |
| Reports     | By department:  CS 6 | ECE 4 | Mech 4          |
| Notifs      | [! Low registrations - amber] Photo Walk       |
|             | [! Overdue - red] 2 tasks overdue              |
+-------------+------------------------------------------------+
```

Notes: figures are computed by the system, nothing typed; the one waiting decision is the biggest element.
Empty: "Nothing needs your decision. New submissions will appear here."
Error: "We could not load the dashboard numbers. Your data is safe. Try again in a moment." with [ Try again ].
Next: AD-02

## AD-02 Approvals queue (A1)

```
+--------------------------------------------------------------+
| Approvals                                       A-  A  A+    |
+-------------+------------------------------------------------+
| > Approvals | Soonest first                                  |
| Calendar    | Tech Fest      12 Mar  Seminar Hall  CS        |
| Venues & Res|   [! Pending approval - amber]    [ Open ]     |
| Reports     | Photo Walk     02 Apr  Main Lawn     ECE       |
| Notifs      |   [! Pending approval - amber]    [ Open ]     |
+-------------+------------------------------------------------+
```

Notes: sorted by soonest event date so the most urgent is first.
Empty: "No events are waiting. You are all caught up."
Next: AD-03

## AD-03 Approval detail: clash check and confirm (A1, X2, X5)

```
+--------------------------------------------------------------+
| Tech Fest 2026                                  A-  A  A+    |
+-------------+------------------------------------------------+
| > Approvals | [! Pending approval - amber]                   |
| Calendar    | 12 Mar 10:00-12:00, Seminar Hall, 60 seats     |
| Venues & Res| Resources: Projector, Microphone               |
| Reports     | Clash check (computed): no clash               |
| Notifs      |   or: [# Clash - red] Annual Day, same hall    |
|             | Return reason: [ required when returning ]     |
|             |  [ Return with reason ]        [ Approve ]     |
+-------------+------------------------------------------------+

Review & Confirm panel (after Approve or Return):
+------------------------------------------+
| Approve Tech Fest 2026?                  |
| What will happen: the venue is booked    |
| and the coordinator is told in-app.      |
|         [ Go back ]  [ Confirm ]         |
+------------------------------------------+
After Confirm: "Approved. The coordinator has been notified."
```

Notes: Prefill: the clash check, venue, slot and resources are computed and shown, the Admin types nothing to approve. Return needs a reason, otherwise "Add a short reason so the coordinator knows what to fix." Approve is blocked when a clash exists.
Error: "We could not save your decision. Nothing was changed. Try again."
Next: AD-04, AD-02

## AD-04 Calendar with conflicts (A2, X1)

```
+--------------------------------------------------------------+
| Calendar - March                                A-  A  A+    |
+-------------+------------------------------------------------+
| Approvals   |        Seminar Hall   Room 204    Auditorium   |
| > Calendar  | 12 Mar  Tech Fest     Quiz Night  Annual Day   |
| Venues & Res|         [+ Approved - blue]                    |
| Reports     | 13 Mar  Workshop      -           Annual Day   |
| Notifs      |         [# Clash - red] Workshop vs Annual Day |
+-------------+------------------------------------------------+
```

Notes: conflicts are marked by icon, the word "Clash" and the colour name red, never colour alone.
Next: AD-06

## AD-05 Venues and Resources (A3)

```
+--------------------------------------------------------------+
| Venues and Resources                            A-  A  A+    |
+-------------+------------------------------------------------+
| Approvals   | Venue          Capacity  Available             |
| Calendar    | Seminar Hall   120       yes                   |
| > Venues&Res| Room 204        70       yes                   |
| Reports     | Auditorium     300       no (maintenance)      |
| Notifs      | Resource       Total     Free today            |
|             | Projector       4         1                    |
|             | [ + Add venue ]  [ + Add resource ]            |
+-------------+------------------------------------------------+
```

Notes: capacity and availability are visible at a glance; changes to availability that affect booked events are flagged before saving.
Next: end

## AD-06 Reports (A5, A4)

```
+--------------------------------------------------------------+
| Reports                                         A-  A  A+    |
+-------------+------------------------------------------------+
| Approvals   | Period: [ Feb 2026 ]  Department: [All]        |
| Calendar    | Events held 14   Registrations 520   Seats 71% |
| Venues & Res| Event            Dept   Registered  Status     |
| > Reports   | Quiz Night       CS     52 / 60     [* Completed - slate] |
| Notifs      |                      [ Export CSV ]  [ Print ]  |
+-------------+------------------------------------------------+
```

Notes: Export CSV and Print are the two output actions (A5); the period is prefilled with the last full month.
Next: end
