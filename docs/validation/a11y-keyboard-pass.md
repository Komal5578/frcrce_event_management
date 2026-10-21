# Accessibility & Keyboard Validation Pass

This validation checklist is intended for manual execution by the development and design team. In accordance with project integrity ground rules, all result cells remain blank until real human testing is conducted. AI agents do not pre-fill or record evaluation findings.

> [!NOTE]
> Time-to-find-the-problem (addressing dom-hmi-problems #6) is not measured in this document. It will be timed and evaluated with actual users during Phase 6 user testing.

---

## Table 1: Primary Keyboard Navigation & Text Scaling Flows

### Coordinator Keyboard Flow

| Role / Size | Step | Expected | Result (Yes/No) | Notes |
|-------------|------|----------|-----------------|-------|
| Coordinator (A-) | New event | Focus lands on New Event form | | |
| Coordinator (A-) | Tab to Workshop radio -> Start | Selection activates and starts draft | | |
| Coordinator (A-) | Title and seats -> Save and continue | Input fields accept values and proceed | | |
| Coordinator (A-) | Date/time -> Show free venues | Free venues populate without focus loss | | |
| Coordinator (A-) | Venue radio -> Save and continue | Venue selected and proceeds to resources | | |
| Coordinator (A-) | Select Projector -> Save and continue | Resource selected and proceeds to tasks | | |
| Coordinator (A-) | Add task -> Review and submit | Task added and proceeds to review step | | |
| Coordinator (A-) | Confirm submit in dialog | Confirm dialog opens with initial focus on "Go back" | | |
| Coordinator (A-) | Submission completed | Focus lands on Pending Approval alert | | |
| Coordinator (A-) | Reports -> Download CSV -> Print | Reports view navigable, CSV downloads, print preview opens | | |
| Coordinator (A-) | Find problem item in Attention list | Problem link focused and navigates to event edit view | | |
| Coordinator (A) | New event | Focus lands on New Event form | | |
| Coordinator (A) | Tab to Workshop radio -> Start | Selection activates and starts draft | | |
| Coordinator (A) | Title and seats -> Save and continue | Input fields accept values and proceed | | |
| Coordinator (A) | Date/time -> Show free venues | Free venues populate without focus loss | | |
| Coordinator (A) | Venue radio -> Save and continue | Venue selected and proceeds to resources | | |
| Coordinator (A) | Select Projector -> Save and continue | Resource selected and proceeds to tasks | | |
| Coordinator (A) | Add task -> Review and submit | Task added and proceeds to review step | | |
| Coordinator (A) | Confirm submit in dialog | Confirm dialog opens with initial focus on "Go back" | | |
| Coordinator (A) | Submission completed | Focus lands on Pending Approval alert | | |
| Coordinator (A) | Reports -> Download CSV -> Print | Reports view navigable, CSV downloads, print preview opens | | |
| Coordinator (A) | Find problem item in Attention list | Problem link focused and navigates to event edit view | | |
| Coordinator (A+) | New event | Focus lands on New Event form with scaled text | | |
| Coordinator (A+) | Tab to Workshop radio -> Start | Selection activates and starts draft without layout break | | |
| Coordinator (A+) | Title and seats -> Save and continue | Input fields accept values and proceed | | |
| Coordinator (A+) | Date/time -> Show free venues | Free venues populate without focus loss | | |
| Coordinator (A+) | Venue radio -> Save and continue | Venue selected and proceeds to resources | | |
| Coordinator (A+) | Select Projector -> Save and continue | Resource selected and proceeds to tasks | | |
| Coordinator (A+) | Add task -> Review and submit | Task added and proceeds to review step | | |
| Coordinator (A+) | Confirm submit in dialog | Confirm dialog opens with initial focus on "Go back" | | |
| Coordinator (A+) | Submission completed | Focus lands on Pending Approval alert | | |
| Coordinator (A+) | Reports -> Download CSV -> Print | Reports view navigable, CSV downloads, print preview opens | | |
| Coordinator (A+) | Find problem item in Attention list | Problem link focused and navigates to event edit view | | |

### Student Keyboard Flow

| Role / Size | Step | Expected | Result (Yes/No) | Notes |
|-------------|------|----------|-----------------|-------|
| Student (A-) | Discover -> Tab to search | Focus lands on search filter input | | |
| Student (A-) | Type query -> Enter | Filtered event cards display | | |
| Student (A-) | Tab to first card action -> Enter | Registration flow initiates | | |
| Student (A-) | Confirm Dialog -> Go back focused | Dialog opens with default focus on "Go back" | | |
| Student (A-) | Tab to "Confirm register" -> Enter | Registration processes | | |
| Student (A-) | Registration confirmed | Focus moves to success alert, status badge updates | | |
| Student (A-) | Alerts -> Find problem item | Overdue task link focused and navigates to tasks page | | |
| Student (A) | Discover -> Tab to search | Focus lands on search filter input | | |
| Student (A) | Type query -> Enter | Filtered event cards display | | |
| Student (A) | Tab to first card action -> Enter | Registration flow initiates | | |
| Student (A) | Confirm Dialog -> Go back focused | Dialog opens with default focus on "Go back" | | |
| Student (A) | Tab to "Confirm register" -> Enter | Registration processes | | |
| Student (A) | Registration confirmed | Focus moves to success alert, status badge updates | | |
| Student (A) | Alerts -> Find problem item | Overdue task link focused and navigates to tasks page | | |
| Student (A+) | Discover -> Tab to search | Focus lands on search filter input with scaled text | | |
| Student (A+) | Type query -> Enter | Filtered event cards display cleanly | | |
| Student (A+) | Tab to first card action -> Enter | Registration flow initiates | | |
| Student (A+) | Confirm Dialog -> Go back focused | Dialog opens with default focus on "Go back" | | |
| Student (A+) | Tab to "Confirm register" -> Enter | Registration processes | | |
| Student (A+) | Registration confirmed | Focus moves to success alert, status badge updates | | |
| Student (A+) | Alerts -> Find problem item | Overdue task link focused and navigates to tasks page | | |

### Admin Keyboard Flow

| Role / Size | Step | Expected | Result (Yes/No) | Notes |
|-------------|------|----------|-----------------|-------|
| Admin (A-) | Approvals nav -> Tab into queue | Queue aside receives keyboard focus | | |
| Admin (A-) | Tab to item -> Enter | Event detail loads in right pane | | |
| Admin (A-) | Tab through facts -> Approve -> Enter | Confirm dialog opens with focus on "Go back" | | |
| Admin (A-) | Confirm approve -> Enter | Event approved, focus lands on success alert | | |
| Admin (A-) | Return flow -> Reason field | Return with reason requires text before confirm dialog | | |
| Admin (A-) | Reports -> Download CSV -> Print | Reports table navigable, CSV downloads, print view opens | | |
| Admin (A-) | Find problem item in Attention list | Clash/overdue/lowreg link focused and navigates to problem | | |
| Admin (A) | Approvals nav -> Tab into queue | Queue aside receives keyboard focus | | |
| Admin (A) | Tab to item -> Enter | Event detail loads in right pane | | |
| Admin (A) | Tab through facts -> Approve -> Enter | Confirm dialog opens with focus on "Go back" | | |
| Admin (A) | Confirm approve -> Enter | Event approved, focus lands on success alert | | |
| Admin (A) | Return flow -> Reason field | Return with reason requires text before confirm dialog | | |
| Admin (A) | Reports -> Download CSV -> Print | Reports table navigable, CSV downloads, print view opens | | |
| Admin (A) | Find problem item in Attention list | Clash/overdue/lowreg link focused and navigates to problem | | |
| Admin (A+) | Approvals nav -> Tab into queue | Queue aside receives keyboard focus with scaled text | | |
| Admin (A+) | Tab to item -> Enter | Event detail loads cleanly without overflow | | |
| Admin (A+) | Tab through facts -> Approve -> Enter | Confirm dialog opens with focus on "Go back" | | |
| Admin (A+) | Confirm approve -> Enter | Event approved, focus lands on success alert | | |
| Admin (A+) | Return flow -> Reason field | Return with reason requires text before confirm dialog | | |
| Admin (A+) | Reports -> Download CSV -> Print | Reports table navigable, CSV downloads, print view opens | | |
| Admin (A+) | Find problem item in Attention list | Clash/overdue/lowreg link focused and navigates to problem | | |

---

## Table 2: General Accessibility & Usability Standards (Section D)

| Standard Item | Description | Automated Evidence | Team Result |
|---------------|-------------|--------------------|-------------|
| 1. Colour Contrast | All text and UI component borders meet WCAG 2.2 AA contrast ratios | `tests/contrast.test.ts` | |
| 2. Non-Colour Indicators | Status and alert information conveyed with icon + word + colour, never colour alone | `tests/xcut/consistency.test.ts`, `components/ui/status-badge.tsx` | |
| 3. Text Enlargeable | Text scalable through A-/A/A+ controls and browser zoom | `components/ui/text-size-control.tsx`, `tests/xcut/targets.test.ts` | |
| 4. Keyboard Navigation | All interactive controls reachable and operable via keyboard Tab and Enter/Space | `tests/xcut/targets.test.ts`, `tests/xcut/confirm.test.ts` | |
| 5. Touch Target Size | All buttons, links, and input elements meet minimum 44px by 44px touch targets | `tests/xcut/targets.test.ts` | |
| 6. Clear Error Messages | Plain-language human error messages without technical codes, digests, or stack traces | `tests/xcut/states.test.ts`, `app/error.tsx`, `app/global-error.tsx` | |
| 7. Consistent Navigation | Layout navigation order, menus, and breadcrumbs follow uniform hierarchy across roles | `components/ui/app-shell.tsx`, `tests/xcut/targets.test.ts` | |
| 8. Icon Accessibility | Decorative icons hidden via aria-hidden="true"; informative icons carry accessible names | `tests/xcut/consistency.test.ts` | |
| 9. Accessible Forms | All form inputs have explicit associated labels, error states, and aria attributes | `components/ui/field.tsx`, `app/(coordinator)/coordinator/_components/` | |
| 10. Clear Labels | Action buttons use unambiguous verbs (Approve, Submit, Cancel, Register) | `tests/xcut/consistency.test.ts`, `tests/xcut/confirm.test.ts` | |
| 11. Text Scale Layout Usability | Text size A-/A/A+ modifies body text via rem units while spacing and 44px targets hold | `tests/xcut/targets.test.ts` (rem-sizing, AppShell control) | |
| 12. Visible Focus Rings | Visible focus ring on every interactive element with minimum 2px outline width | `tests/xcut/targets.test.ts` (focus-visible rule check) | |
