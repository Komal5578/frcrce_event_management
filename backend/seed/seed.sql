-- Demo seed data for PostgreSQL (synthetic, for local dev and demo)
-- Passwords will be populated by the migration loader using argon2.
-- Dates are relative to database now().

INSERT INTO profiles (id, email, password_hash, name, role, department, is_organizer) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'coordinator@demo.college.test', '', 'Priya Nair', 'coordinator', 'Computer Science', FALSE),
  ('a0000000-0000-0000-0000-000000000002', 'coordinator2@demo.college.test', '', 'Rahul Mehta', 'coordinator', 'Mechanical', FALSE),
  ('a0000000-0000-0000-0000-000000000003', 'admin@demo.college.test', '', 'Dr. Sunita Rao', 'admin', 'Administration', FALSE),
  ('a0000000-0000-0000-0000-000000000004', 'student@demo.college.test', '', 'Asha Patel', 'student', 'Computer Science', TRUE),
  ('a0000000-0000-0000-0000-000000000005', 'karan@demo.college.test', '', 'Karan Shah', 'student', 'Mechanical', FALSE),
  ('a0000000-0000-0000-0000-000000000006', 'meera@demo.college.test', '', 'Meera Iyer', 'student', 'Electronics', FALSE),
  ('a0000000-0000-0000-0000-000000000007', 'dev@demo.college.test', '', 'Dev Kulkarni', 'student', 'Civil', FALSE);

INSERT INTO venues (id, name, capacity, location, active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Main Auditorium', 400, 'Main Block', TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'Seminar Hall A', 120, 'Academic Block', TRUE),
  ('b0000000-0000-0000-0000-000000000003', 'Lab 3', 40, 'CS Building', TRUE),
  ('b0000000-0000-0000-0000-000000000004', 'Open Air Theatre', 600, 'Campus Garden', TRUE),
  ('b0000000-0000-0000-0000-000000000005', 'Library Conference Room', 30, 'Library, Floor 2', TRUE),
  ('b0000000-0000-0000-0000-000000000006', 'Old Gymkhana Hall', 80, 'Closed for repair', FALSE);

INSERT INTO resources (id, name, quantity) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Projector', 5),
  ('c0000000-0000-0000-0000-000000000002', 'Microphones', 6),
  ('c0000000-0000-0000-0000-000000000003', 'Chairs', 300),
  ('c0000000-0000-0000-0000-000000000004', 'Extension boards', 10),
  ('c0000000-0000-0000-0000-000000000005', 'Camera', 2),
  ('c0000000-0000-0000-0000-000000000006', 'Banner stand', 4);

INSERT INTO event_templates (id, name, type, description, default_duration_minutes, default_capacity, department) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Workshop', 'workshop', 'Hands-on session with a small group and a facilitator.', 180, 40, NULL),
  ('d0000000-0000-0000-0000-000000000002', 'Guest Lecture', 'lecture', 'Talk by an invited speaker, followed by questions.', 90, 120, NULL),
  ('d0000000-0000-0000-0000-000000000003', 'Cultural Night', 'cultural', 'Evening performances open to the whole college.', 180, 400, NULL);

-- Events: includes two overlapping pending events at Seminar Hall A (allowed per A1),
-- while all approved/open/ongoing events do not overlap per venue.
INSERT INTO events (id, title, type, description, coordinator_id, venue_id, starts_at, ends_at, capacity, status, department, template_id, return_reason, cancel_reason) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Intro to Git (draft)', 'workshop', 'Still being written.', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, NULL, NULL, 'draft', 'Computer Science', 'd0000000-0000-0000-0000-000000000001', NULL, NULL),
  ('e0000000-0000-0000-0000-000000000002', 'Robotics Guest Lecture', 'lecture', 'Industry talk on factory robots.', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', now() + interval '10 days', now() + interval '10 days' + interval '90 minutes', 100, 'pending', 'Mechanical', 'd0000000-0000-0000-0000-000000000002', NULL, NULL),
  ('e0000000-0000-0000-0000-000000000010', 'AI & Ethics Seminar', 'lecture', 'Overlapping pending request for Seminar Hall A.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', now() + interval '10 days' + interval '30 minutes', now() + interval '10 days' + interval '120 minutes', 80, 'pending', 'Computer Science', NULL, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000003', 'Web Dev Workshop', 'workshop', 'Build and deploy a small site.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', now() + interval '12 days', now() + interval '12 days' + interval '3 hours', 30, 'approved', 'Computer Science', 'd0000000-0000-0000-0000-000000000001', NULL, NULL),
  ('e0000000-0000-0000-0000-000000000004', 'Annual Tech Fest Keynote', 'lecture', 'Opening keynote of the tech fest.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 400, 'open', 'Computer Science', NULL, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000005', 'Open Mic Night', 'cultural', 'Music and poetry; small guest list.', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', now() + interval '5 days', now() + interval '5 days' + interval '3 hours', 2, 'open', 'Mechanical', 'd0000000-0000-0000-0000-000000000003', NULL, NULL),
  ('e0000000-0000-0000-0000-000000000006', 'Research Reading Circle', 'workshop', 'Weekly paper discussion.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', now() - interval '1 hour', now() + interval '2 hours', 25, 'ongoing', 'Computer Science', NULL, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000007', 'CAD Basics Seminar', 'lecture', 'Introductory CAD seminar.', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', now() - interval '10 days', now() - interval '10 days' + interval '90 minutes', 100, 'completed', 'Mechanical', NULL, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000008', 'Hackathon Kickoff (cancelled)', 'workshop', 'Moved to next term.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 200, 'cancelled', 'Computer Science', NULL, NULL, 'Clashed with exam schedule.'),
  ('e0000000-0000-0000-0000-000000000009', 'Electronics Expo', 'cultural', 'Student project showcase.', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', now() + interval '15 days', now() + interval '15 days' + interval '4 hours', 60, 'returned', 'Mechanical', NULL, 'Lab 3 only fits 40. Pick a bigger venue or lower the capacity.', NULL);

INSERT INTO resource_allocations (id, event_id, resource_id, quantity) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 2),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 4),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 2),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 2);

-- Registrations (full event: capacity 2, two confirmed, one waitlisted)
INSERT INTO registrations (id, event_id, user_id, status, created_at) VALUES
  ('10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'confirmed', now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'confirmed', now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'cancelled', now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'confirmed', now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'confirmed', now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000007', 'waitlisted', now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'confirmed', now() - interval '20 days');

-- Tasks (organizer Asha has one overdue)
INSERT INTO tasks (id, event_id, title, description, assignee_id, due_at, status, completed_at) VALUES
  ('20000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'Print posters', 'A3, ten copies.', 'a0000000-0000-0000-0000-000000000005', now() + interval '4 days', 'todo', NULL),
  ('20000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'Set up stage', 'Podium, mic check.', 'a0000000-0000-0000-0000-000000000006', now() + interval '6 days', 'doing', NULL),
  ('20000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', 'Book photographer', 'Confirmed by email.', 'a0000000-0000-0000-0000-000000000007', now() - interval '1 day', 'done', now() - interval '2 days'),
  ('20000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'Collect speaker bio', 'Needed for the programme.', 'a0000000-0000-0000-0000-000000000004', now() - interval '2 days', 'todo', NULL);

-- Notifications (one unread)
INSERT INTO notifications (id, user_id, event_id, kind, body, read_at) VALUES
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'task_assigned', 'You were given the task "Collect speaker bio".', NULL),
  ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'event_approved', '"Web Dev Workshop" was approved.', now() - interval '1 day');
