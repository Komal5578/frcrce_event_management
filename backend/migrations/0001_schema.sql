-- PostgreSQL schema for College Event Management (dom-domain-model, adr-001)

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coordinator', 'student', 'admin')),
  department TEXT,
  is_organizer BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_attempted_at_idx ON login_attempts (email, attempted_at);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  default_duration_minutes INTEGER,
  default_capacity INTEGER,
  department TEXT
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT,
  description TEXT,
  coordinator_id UUID NOT NULL REFERENCES profiles (id),
  venue_id UUID REFERENCES venues (id),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  capacity INTEGER CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft', 'pending', 'approved', 'open', 'ongoing', 'completed', 'cancelled', 'returned')),
  department TEXT,
  template_id UUID REFERENCES event_templates (id),
  return_reason TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources (id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (event_id, resource_id)
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX registrations_user_idx ON registrations (user_id);
CREATE INDEX registrations_event_status_idx ON registrations (event_id, status);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles (id),
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tasks_assignee_idx ON tasks (assignee_id);
CREATE INDEX tasks_event_idx ON tasks (event_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id),
  event_id UUID REFERENCES events (id) ON DELETE SET NULL,
  kind TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id);

-- Venue calendar view for admin/coordinators
CREATE OR REPLACE VIEW bookings AS
  SELECT id AS event_id, venue_id, starts_at, ends_at, status
  FROM events
  WHERE status IN ('pending', 'approved', 'open', 'ongoing') AND venue_id IS NOT NULL;
