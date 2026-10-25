-- D1/SQLite schema (dom-domain-model). Supersedes the Postgres schema.
-- Ids are TEXT supplied by the app (crypto.randomUUID()). Timestamps are UTC ISO text with
-- millisecond precision, enforced by GLOB so the string comparison in the clash triggers is valid.
-- Held statuses (hold a venue and resources): approved, open, ongoing. Pending requests may overlap.

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coordinator', 'student', 'admin')),
  department TEXT,
  is_organizer INTEGER NOT NULL DEFAULT 0 CHECK (is_organizer IN (0, 1))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL CHECK (expires_at GLOB '????-??-??T??:??:??.???Z'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at GLOB '????-??-??T??:??:??.???Z')
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE event_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  default_duration_minutes INTEGER,
  default_capacity INTEGER,
  department TEXT
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  description TEXT,
  coordinator_id TEXT NOT NULL REFERENCES profiles (id),
  venue_id TEXT REFERENCES venues (id),
  starts_at TEXT CHECK (starts_at GLOB '????-??-??T??:??:??.???Z'),
  ends_at TEXT CHECK (ends_at GLOB '????-??-??T??:??:??.???Z'),
  capacity INTEGER CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft', 'pending', 'approved', 'open', 'ongoing', 'completed', 'cancelled', 'returned')),
  department TEXT,
  template_id TEXT REFERENCES event_templates (id),
  return_reason TEXT,
  cancel_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at GLOB '????-??-??T??:??:??.???Z'),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (updated_at GLOB '????-??-??T??:??:??.???Z'),
  -- draft autosave (C1): details may be missing only while the event is not yet a real booking
  CONSTRAINT events_complete_unless_draft CHECK (
    status IN ('draft', 'cancelled', 'returned')
    OR (venue_id IS NOT NULL AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND capacity IS NOT NULL)),
  CONSTRAINT events_time_order CHECK (ends_at > starts_at)
);
CREATE INDEX events_status_starts_idx ON events (status, starts_at);
CREATE INDEX events_venue_starts_idx ON events (venue_id, starts_at);
CREATE INDEX events_coordinator_idx ON events (coordinator_id);

CREATE TABLE resource_allocations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources (id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (event_id, resource_id)
);

CREATE TABLE registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles (id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at GLOB '????-??-??T??:??:??.???Z'),
  UNIQUE (event_id, user_id)
);
CREATE INDEX registrations_user_idx ON registrations (user_id);
CREATE INDEX registrations_event_status_idx ON registrations (event_id, status);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES profiles (id),
  due_at TEXT CHECK (due_at GLOB '????-??-??T??:??:??.???Z'),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  completed_at TEXT CHECK (completed_at GLOB '????-??-??T??:??:??.???Z'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at GLOB '????-??-??T??:??:??.???Z')
);
CREATE INDEX tasks_assignee_idx ON tasks (assignee_id);
CREATE INDEX tasks_event_idx ON tasks (event_id);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles (id),
  event_id TEXT REFERENCES events (id) ON DELETE SET NULL,
  kind TEXT,
  body TEXT,
  read_at TEXT CHECK (read_at GLOB '????-??-??T??:??:??.???Z'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at GLOB '????-??-??T??:??:??.???Z')
);
CREATE INDEX notifications_user_idx ON notifications (user_id);

-- Venue calendar for the admin (no range type in SQLite: start and end columns).
CREATE VIEW bookings AS
  SELECT id AS event_id, venue_id, starts_at, ends_at, status
  FROM events
  WHERE status IN ('approved', 'open', 'ongoing') AND venue_id IS NOT NULL;

-- Sign-in rate limit (same rule as the Postgres backend: LOGIN_MAX_FAILURES in LOGIN_WINDOW_MINUTES).
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX login_attempts_email_idx ON login_attempts (email, attempted_at);
