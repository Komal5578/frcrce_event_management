---
status: complete
phase: 03-foundation
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-06-SUMMARY.md, 03-07-SUMMARY.md, 03-08-SUMMARY.md, 03-09-SUMMARY.md, 03-10-SUMMARY.md]
started: 2026-10-20T15:19:07Z
updated: 2026-10-20T15:40:00Z
---

Site under test: https://college-events.varadaj47.workers.dev (deployed, DEMO_LOGIN=true)
Demo password for all seeded accounts: demo-password-2026

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 9
name: Cold start smoke test
expected: |
  Stop any running dev server. Run `npm run db:reset`, then `npm run dev`.
  The server starts without errors, the seed completes, and /login loads with
  the demo buttons. (Migrations and seed changed in this phase.)
awaiting: complete

## Tests

### 1. Login page shows demo buttons and password form
expected: Open /login. Sign-in heading, email and password fields, Sign in button, and three "Continue as ..." demo buttons (Coordinator, Student, Admin). Visible focus outline when tabbing.
result: pass

### 2. Signed-out visit to a role page sends you to login
expected: In a private window, open /coordinator directly. The browser lands on /login. Same for /student and /admin.
result: pass

### 3. Demo button signs in to the coordinator home
expected: On /login click "Continue as Coordinator". You land on the coordinator home page and see the coordinator's name, not the login form.
result: pass

### 4. Password sign-in works and lands in the right role
expected: Sign out. On /login enter coordinator@demo.college.test and demo-password-2026, click Sign in. You land on the coordinator home. Repeat with student@demo.college.test and admin@demo.college.test: each lands on its own home.
result: pass

### 5. Wrong password gives a plain, generic message
expected: On /login enter coordinator@demo.college.test and a wrong password. A plain-language error appears (the same message for an unknown email). No technical text, no stack trace, no SQL. The error is announced or focused so a keyboard or screen reader user can find it.
result: pass

### 6. Signed-in user cannot open another role's page
expected: Signed in as a student, open /admin. You are redirected to the student home, not shown the admin page.
result: pass

### 7. Sign out ends the session
expected: While signed in, sign out. Then open /coordinator. You are sent to /login. Reloading /login after sign out shows the form, not a signed-in state.
result: pass

### 8. Status badges use icon, text and colour
expected: Open /design. Each status badge (for example Approved, Pending, Cancelled) shows an icon and a text label, not colour alone. The text-size control (A-, A, A+) changes the page text size.
result: pass

### 9. Cold start smoke test
expected: Stop any running dev server. Run `npm run db:reset`, then `npm run dev`. The server starts without errors, the seed completes, and /login loads with the demo buttons. (Migrations and seed changed in this phase.)
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
