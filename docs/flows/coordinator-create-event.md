# Flow: Coordinator creates and submits an event

Confidence: derived (AI-drafted, not user-tested)

Goal: get a clash-free event approved with venue, resources and tasks in as few steps as possible (C1-C5, X2, X5; `dom-flows`, `dom-status-vocabulary`).

```mermaid
flowchart TD
  L["Login"]
  CO01["CO-01 My Events (C1)"]
  CO02["CO-02 New Event: template and details (C1)"]
  P1["Prefill: template defaults and organiser's department and contact"]
  CO03["CO-03 Venue and slot picker (C2)"]
  P2["Prefill: only free venues for the slot, capacity shown"]
  D1{"Venue taken between pick and save?"}
  E1["ERR: #quot;Seminar Hall was just booked for that time. Here are the halls still free.#quot;"]
  CO04["CO-04 Resources (C3)"]
  CO05["CO-05 Tasks (C4)"]
  N1["Note: draft autosaves at every step (C1)"]
  RC1["Review & Confirm: submit event (CO-06, C5)"]
  DO1["DO: submit for approval"]
  CO07["CO-07 Submitted / Monitor (C5, C6)"]
  CO08["CO-08 Event summary (C6)"]
  RC2["Review & Confirm: cancel event, registrants are told (CO-06 variant)"]
  DO2["DO: cancel event"]
  L --> CO01
  CO01 --> CO02
  CO02 --> P1
  P1 --> CO03
  CO03 --> P2
  P2 --> D1
  D1 -->|yes| E1
  E1 --> CO03
  D1 -->|no| CO04
  CO04 --> CO05
  CO02 -.-> N1
  CO05 --> RC1
  RC1 --> DO1
  DO1 --> CO07
  CO07 --> CO08
  CO07 --> RC2
  RC2 --> DO2
  DO2 --> CO01
```

## Reading the flow
- `Prefill:` the system already knows this, so the coordinator confirms instead of typing.
- `RCn` nodes are Review & Confirm screens. Every `DO:` (irreversible) node is entered directly from one.
- `ERR:` nodes show the plain-language message. The venue clash is also impossible in the database (`dom-domain-model`).
- Cancelling is only offered from Monitor, after the review step, with the effect on registrants stated.
