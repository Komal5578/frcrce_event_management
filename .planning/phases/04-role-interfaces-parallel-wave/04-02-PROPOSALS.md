# 04-02 proposals (frozen files; not edited)

1. `components/ui/confirm-dialog.tsx`: add an optional `destructive` prop so "Confirm cancel registration" renders with the destructive (red) Button variant (UI-SPEC R&C table). Currently always primary. Also "Go back" is after "Confirm" in DOM, so initial focus lands on Confirm (showModal focuses the first focusable); UI-SPEC wants Go back first/focused.
2. Plan text says the full seed event is "Tech Fest Keynote (capacity 2)". In seed.sql the Keynote has capacity 400; the full event is Open Mic Night (capacity 2, 2 confirmed, 1 waitlisted). Fix the plan/manual-test wording (04-04).
