# Flow: Student registers for an event

Confidence: derived (AI-drafted, not user-tested)

Goal: find an event worth attending and register in as few interactions as possible (S1-S4, X2; `dom-flows`).

```mermaid
flowchart TD
  L["Login"]
  ST01["ST-01 Discover (S1)"]
  P1["Prefill: this student's department and the this-week shortcut"]
  ST02["ST-02 Event detail (S2)"]
  D1{"Seats left?"}
  D2{"Already registered?"}
  E1["ERR: #quot;You're already registered for this event. See it in My Events.#quot;"]
  E2["ERR: #quot;This event is full. You can join the waitlist; you'd be number 4.#quot; (figure is illustrative)"]
  RC1["Review & Confirm: register (ST-03, S3)"]
  DO1["DO: register"]
  RC2["Review & Confirm: join waitlist (ST-03 variant)"]
  DO2["DO: register on waitlist, position shown"]
  ST04["ST-04 My Events and calendar (S4), reminder set"]
  RC3["Review & Confirm: cancel registration (ST-03 variant)"]
  DO3["DO: cancel registration"]
  ST05["ST-05 My Tasks, organizer only (S5)"]
  L --> ST01
  ST01 --> P1
  P1 --> ST02
  ST02 --> D2
  D2 -->|yes| E1
  E1 --> ST04
  D2 -->|no| D1
  D1 -->|yes| RC1
  RC1 --> DO1
  DO1 --> ST04
  D1 -->|no| E2
  E2 --> RC2
  RC2 --> DO2
  DO2 --> ST04
  ST04 --> RC3
  RC3 --> DO3
  DO3 --> ST04
  ST04 -.->|organizer| ST05
```

## Reading the flow
- Double registration is blocked in the database and in the UI (`dom-domain-model`); the `ERR:` message sends the student to where the registration lives.
- The waitlist number in the full-event message is illustrative, not observed data.
- Organizer branch: see `organizer-mark-task-done.md`.
