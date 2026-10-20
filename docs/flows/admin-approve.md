# Flow: Admin decides on a pending event

Confidence: derived (AI-drafted, not user-tested)

Goal: decide pending events quickly with the clash check already done (A1, A2, A5, X2, X5; `dom-flows`).

```mermaid
flowchart TD
  L["Login"]
  AD01["AD-01 Dashboard (A4)"]
  AD02["AD-02 Approvals queue (A1)"]
  AD03["AD-03 Approval detail (A1)"]
  P1["Prefill: clash check result and requested resources computed by the system"]
  D1{"Clash found?"}
  E1["ERR: #quot;This overlaps Robotics Workshop in Seminar Hall (10:00-12:00). Return it with a reason or pick another slot.#quot; (example)"]
  RC1["Review & Confirm: approve (AD-03 panel, X2)"]
  DO1["DO: approve"]
  R1["Enter reason for return"]
  RC2["Review & Confirm: return with reason"]
  DO2["DO: return with reason"]
  AD04["AD-04 Calendar with conflicts (A2)"]
  AD06["AD-06 Reports, export (A5)"]
  L --> AD01
  AD01 --> AD02
  AD02 --> AD03
  AD03 --> P1
  P1 --> D1
  D1 -->|yes| E1
  E1 --> R1
  D1 -->|no| RC1
  RC1 --> DO1
  DO1 --> AD04
  R1 --> RC2
  RC2 --> DO2
  DO2 --> AD02
  AD04 --> AD06
```

## Reading the flow
- Approve is only offered when no clash exists; with a clash the admin returns the event with a reason.
- Export on AD-06 is not irreversible, so it has no Review & Confirm.
