---
id: dom-flows
type: domain
title: Goal-directed task flows and navigation
tags: [flows,information-architecture,navigation]
confidence: derived
sources: [src-gdd-process]
summary: Ordered flows and top-level navigation per role.
updated: 2026-10-20
---

# Flows

- **Coordinator:** Login → My Events → New Event (template) → Venue + slot (live availability) → Resources → Tasks → Review & Confirm → Submit → Monitor → Event summary
- **Student:** Login → Discover → Event detail → Register (Review & Confirm) → My Registrations/Calendar → Reminders. Organizer branch: → My Tasks → Mark done
- **Admin:** Login → Approvals → (clash check) → Approve / Return → Calendar → Utilisation → Report

# Navigation (top level, max 5 per role)
- Coordinator: My Events · Calendar · Tasks · Notifications
- Student: Discover · My Events · My Tasks (if organizer) · Notifications
- Admin: Approvals · Calendar · Venues & Resources · Reports · Notifications

# Detail
- Coordinator: [docs/flows/coordinator-create-event.md](../../docs/flows/coordinator-create-event.md)
- Student: [docs/flows/student-register.md](../../docs/flows/student-register.md)
- Admin: [docs/flows/admin-approve.md](../../docs/flows/admin-approve.md)
- Organizer (reversible, no Review & Confirm): [docs/flows/organizer-mark-task-done.md](../../docs/flows/organizer-mark-task-done.md)
- Screen inventories: [docs/ia/](../../docs/ia/)

Roles share component library and vocabulary (X4), not screens.
