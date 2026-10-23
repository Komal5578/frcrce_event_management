# Student wireframes (ST-01..ST-06)

Confidence: derived (AI-drafted, not user-tested). All names, dates and numbers are illustrative placeholders, no real people.

Phone-first, bottom tab bar of 4 nav items (D-08). Screen ids and req ids come from `docs/ia/student.md`. The My Tasks tab is hidden for non-organizers (D-02, `adr-002-roles`).

Legend (greyscale low-fi; Phase 3 picks real icons and tokens from `dom-status-vocabulary`):

- Icon proxies: Draft `~`, Pending approval `!`, Approved `+`, Open `o`, Full/Waitlist `=`, Ongoing `>`, Completed `*`, Cancelled `x`, Registered `+`, Overdue `!`.
- Status chip format: `[<icon> <Word> - <colour name>]`. Colours from `dom-status-vocabulary`: Open green, Full/Waitlist orange, Ongoing teal, Completed slate, Cancelled red. Registered green, Waitlisted orange and task colours (To do grey, Done slate, Overdue red) are assumed until Phase 3 tokens.
- Buttons are `[ Label ]` and filter chips `[Label]`; they are not status chips. Every target is 44px.
- `A- A A+` is the text size control, top right of every page header.
- Irreversible actions go through Review & Confirm (X2).

## ST-01 Discover (S1, X1, X3)

```
+--------------------------------+
| Discover            A- A A+    |
| [ Search events...          ]  |
| [This week] [Type] [Venue] [Dept]|
|--------------------------------|
| Quiz Night                     |
| Fri 20 Feb, 17:00  Room 204    |
| 22 seats left                  |
| [o Open - green] [ View details ]|
|--------------------------------|
| Tech Talk                      |
| Sat 21 Feb, 11:00  Hall A      |
| 0 seats left                   |
| [= Full - orange] [ View details ]|
|--------------------------------|
| Discover | My Events | Tasks* | Notifications |
+--------------------------------+
 * Tasks tab hidden for non-organizers
```

Notes: "This week" filter is prefilled because the system knows today's date; department filter prefilled from the student's profile. Each card answers what, when, where and seats left.
Empty: "No events match. Clear a filter to see more." with [ Clear filters ].
Error: "We could not load events. Check your connection and try again." with [ Try again ].
Next: ST-02, ST-05

## ST-02 Event detail (S2, X1)

```
+--------------------------------+
| < Back              A- A A+    |
| Quiz Night                     |
| [o Open - green]               |
| Fri 20 Feb, 17:00-18:30        |
| Room 204, Block B              |
| 22 of 60 seats left            |
| Hosted by Computer Science     |
| About: short description...    |
|                                |
|        [ Register ]            |
|--------------------------------|
| Discover | My Events | Notifications  |
+--------------------------------+
```

Notes: full event shows `[= Full - orange]`, "You would be number 4 on the waitlist" and [ Join waitlist ] in place of Register. Already registered shows `[+ Registered - green]` and no Register button (no double registration).
Next: ST-03

## ST-03 Review and Confirm (S3, X2, X5)

```
+--------------------------------+
| Review             A- A A+     |
| You are registering for:       |
|  Quiz Night                    |
|  Fri 20 Feb, 17:00, Room 204   |
| What will happen:              |
|  You get a seat and a reminder |
|  the day before.               |
|                                |
| [ Go back ]  [ Confirm ]       |
+--------------------------------+
After Confirm:
+--------------------------------+
| You're registered              |
| [+ Registered - green]         |
| See it in My Events.           |
|        [ View my events ]      |
+--------------------------------+
```

Notes: waitlist variant says "You will be added to the waitlist at position 4. We will tell you if a seat opens." then "You're on the waitlist" with `[= Waitlisted - orange]`. Cancel variant says "Your seat will be released and the next person on the waitlist is offered it." with [ Go back ] [ Confirm cancel ], then "Registration cancelled". A time overlap with another registered event shows a warning naming that event; you can still confirm (warn-only, S6).
Next: ST-04

## ST-04 My Events and calendar (S4)

```
+--------------------------------+
| My Events           A- A A+    |
| Feb:  M  T  W  T [F] S  S      |
|      16 17 18 19 20* 21 22     |
|--------------------------------|
| Quiz Night   Fri 20 Feb 17:00  |
| [+ Registered - green]         |
|                  [ Cancel ]    |
|--------------------------------|
| Tech Talk    Sat 21 Feb 11:00  |
| [= Waitlisted - orange] #4     |
|                  [ Cancel ]    |
|--------------------------------|
| Discover | My Events | Notifications  |
+--------------------------------+
```

Notes: cards plus a calendar strip so "Am I registered?" is answered without a table; today and event days are marked in the strip. Past events show `[* Completed - slate]`.
Next: end, ST-03

## ST-05 My Tasks (S5)

```
+--------------------------------+
| My Tasks            A- A A+    |
| Organizer view only            |
|--------------------------------|
| Print passes - Tech Fest       |
| Due 08 Mar   [~ To do - grey]  |
|                [ Mark done ]   |
|--------------------------------|
| Test mic - Tech Fest           |
| Due 11 Mar [! Overdue - red]   |
|                [ Mark done ]   |
|--------------------------------|
| Discover | My Events | Tasks | Notifications |
+--------------------------------+
After Mark done: "Marked done." [ Undo ]
```

Notes: reachable only for organizers (tab hidden for non-organizers, D-02). Marking done is reversible, so no confirm step; Undo is offered right after.
Next: end

## ST-06 Notifications (S4)

```
+--------------------------------+
| Notifications      A- A A+     |
|--------------------------------|
| Reminder: Quiz Night is        |
| tomorrow at 17:00, Room 204.   |
|--------------------------------|
| A seat opened for Tech Talk.   |
| [+ Registered - green]         |
|--------------------------------|
| Discover | My Events | Notifications  |
+--------------------------------+
```

Notes: reminders and changes are shown in-app only (`adr-004-scope`, no email or SMS).
Empty: "Nothing new. Reminders will show up here."
Next: end
