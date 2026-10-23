-- PostgreSQL exclusion constraint for venue booking clashes (btree_gist)
-- A1 decision: Only approved, open, and ongoing events hold a venue.
-- Pending requests do NOT hold a venue, allowing multiple pending requests to overlap.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE events ADD CONSTRAINT events_no_venue_clash EXCLUDE USING gist (
  venue_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status IN ('approved', 'open', 'ongoing'));
