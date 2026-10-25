-- Guard triggers (dom-domain-model): the database refuses clashes, overbooking, over-allocation
-- and impossible status moves, whatever the app does. Error markers: VENUE_CLASH, EVENT_FULL,
-- RESOURCE_SHORT, BAD_STATE.
-- A1: only approved/open/ongoing events hold a venue or resources. Pending requests may overlap;
-- the admin resolves the clash at approval, which is when these triggers fire.

CREATE TRIGGER events_no_clash_ins BEFORE INSERT ON events
FOR EACH ROW WHEN NEW.status IN ('approved', 'open', 'ongoing')
BEGIN
  SELECT RAISE(ABORT, 'VENUE_CLASH') WHERE EXISTS (
    SELECT 1 FROM events x
    WHERE x.venue_id = NEW.venue_id AND x.id <> NEW.id
      AND x.status IN ('approved', 'open', 'ongoing')
      AND x.starts_at < NEW.ends_at AND NEW.starts_at < x.ends_at);
END;

CREATE TRIGGER events_no_clash_upd BEFORE UPDATE OF status, venue_id, starts_at, ends_at ON events
FOR EACH ROW WHEN NEW.status IN ('approved', 'open', 'ongoing')
BEGIN
  SELECT RAISE(ABORT, 'VENUE_CLASH') WHERE EXISTS (
    SELECT 1 FROM events x
    WHERE x.venue_id = NEW.venue_id AND x.id <> NEW.id
      AND x.status IN ('approved', 'open', 'ongoing')
      AND x.starts_at < NEW.ends_at AND NEW.starts_at < x.ends_at);
END;

-- A2: re-check allocations when an event becomes held or is rescheduled (the v1 gap).
CREATE TRIGGER events_resource_guard BEFORE UPDATE OF status, venue_id, starts_at, ends_at ON events
FOR EACH ROW WHEN NEW.status IN ('approved', 'open', 'ongoing')
BEGIN
  SELECT RAISE(ABORT, 'RESOURCE_SHORT') WHERE EXISTS (
    SELECT 1 FROM resource_allocations a JOIN resources r ON r.id = a.resource_id
    WHERE a.event_id = NEW.id
      AND a.quantity > r.quantity - COALESCE((
        SELECT sum(o.quantity) FROM resource_allocations o JOIN events e ON e.id = o.event_id
        WHERE o.resource_id = a.resource_id AND e.id <> NEW.id
          AND e.status IN ('approved', 'open', 'ongoing')
          AND e.starts_at < NEW.ends_at AND NEW.starts_at < e.ends_at), 0));
END;

-- Allowed graph for anyone; who may take each step is checked in the app.
CREATE TRIGGER events_transition BEFORE UPDATE OF status ON events
FOR EACH ROW WHEN NEW.status <> OLD.status
BEGIN
  SELECT RAISE(ABORT, 'BAD_STATE') WHERE NOT (
       (OLD.status IN ('draft', 'returned') AND NEW.status = 'pending')
    OR (OLD.status = 'pending' AND NEW.status IN ('approved', 'returned'))
    OR (OLD.status = 'approved' AND NEW.status = 'open')
    OR (OLD.status = 'open' AND NEW.status = 'ongoing')
    OR (OLD.status = 'ongoing' AND NEW.status = 'completed')
    OR (NEW.status = 'cancelled' AND OLD.status IN ('draft', 'pending', 'returned', 'approved', 'open', 'ongoing')));
END;

CREATE TRIGGER registrations_capacity_ins BEFORE INSERT ON registrations
FOR EACH ROW WHEN NEW.status = 'confirmed'
BEGIN
  SELECT RAISE(ABORT, 'EVENT_FULL') WHERE
    (SELECT count(*) FROM registrations r WHERE r.event_id = NEW.event_id AND r.status = 'confirmed' AND r.id <> NEW.id)
    >= (SELECT capacity FROM events WHERE id = NEW.event_id);
END;

CREATE TRIGGER registrations_capacity_upd BEFORE UPDATE OF status ON registrations
FOR EACH ROW WHEN NEW.status = 'confirmed' AND OLD.status <> 'confirmed'
BEGIN
  SELECT RAISE(ABORT, 'EVENT_FULL') WHERE
    (SELECT count(*) FROM registrations r WHERE r.event_id = NEW.event_id AND r.status = 'confirmed' AND r.id <> NEW.id)
    >= (SELECT capacity FROM events WHERE id = NEW.event_id);
END;

-- A seat was freed: promote the oldest waitlisted person and tell them, in the same statement.
CREATE TRIGGER registrations_promote AFTER UPDATE OF status ON registrations
FOR EACH ROW WHEN OLD.status = 'confirmed' AND NEW.status = 'cancelled'
BEGIN
  INSERT INTO notifications (user_id, event_id, kind, body)
  SELECT r.user_id, r.event_id, 'waitlist_promoted',
         'A seat opened up and you are now confirmed for "' || (SELECT title FROM events WHERE id = r.event_id) || '".'
  FROM registrations r
  WHERE r.id = (SELECT id FROM registrations WHERE event_id = NEW.event_id AND status = 'waitlisted'
                ORDER BY created_at, id LIMIT 1);
  UPDATE registrations SET status = 'confirmed'
  WHERE id = (SELECT id FROM registrations WHERE event_id = NEW.event_id AND status = 'waitlisted'
              ORDER BY created_at, id LIMIT 1);
END;

-- Allocation can never exceed what other held events at the same time leave free.
CREATE TRIGGER alloc_guard_ins BEFORE INSERT ON resource_allocations
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'RESOURCE_SHORT') WHERE NEW.quantity > (
    (SELECT quantity FROM resources WHERE id = NEW.resource_id) - COALESCE((
      SELECT sum(a.quantity) FROM resource_allocations a
      JOIN events e ON e.id = a.event_id, events me
      WHERE me.id = NEW.event_id AND a.resource_id = NEW.resource_id AND a.id <> NEW.id
        AND e.id <> NEW.event_id AND e.status IN ('approved', 'open', 'ongoing')
        AND e.starts_at < me.ends_at AND me.starts_at < e.ends_at), 0));
END;

CREATE TRIGGER alloc_guard_upd BEFORE UPDATE ON resource_allocations
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'RESOURCE_SHORT') WHERE NEW.quantity > (
    (SELECT quantity FROM resources WHERE id = NEW.resource_id) - COALESCE((
      SELECT sum(a.quantity) FROM resource_allocations a
      JOIN events e ON e.id = a.event_id, events me
      WHERE me.id = NEW.event_id AND a.resource_id = NEW.resource_id AND a.id <> NEW.id
        AND e.id <> NEW.event_id AND e.status IN ('approved', 'open', 'ongoing')
        AND e.starts_at < me.ends_at AND me.starts_at < e.ends_at), 0));
END;
