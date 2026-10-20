# Flow: Student organizer marks a task done

Confidence: derived (AI-drafted, not user-tested)

Goal: show the organizer only their own tasks and let them tick one off in one step (S5; `dom-status-vocabulary`).

This action is reversible, so no Review & Confirm node is used (auto-mode answer 1, X2). Undo is available instead.

```mermaid
flowchart TD
  L["Login"]
  ST01["ST-01 Discover (S1)"]
  ST05["ST-05 My Tasks (S5)"]
  P1["Prefill: only my tasks, soonest due first"]
  M1["Mark done"]
  S1["Status: check icon + Completed + colour"]
  U1["Undo available"]
  L --> ST01
  ST01 --> ST05
  ST05 --> P1
  P1 --> M1
  M1 --> S1
  S1 --> U1
  U1 -.->|Undo| P1
```

## Reading the flow
- Status is shown as icon, text and colour from the shared vocabulary, never colour alone.
