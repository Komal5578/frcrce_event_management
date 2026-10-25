-- Local-only browser fixture: make a pending request overlap the seeded open keynote.
UPDATE events
SET venue_id = (SELECT venue_id FROM events WHERE id = 'e0000000-0000-0000-0000-000000000004'),
    starts_at = (SELECT starts_at FROM events WHERE id = 'e0000000-0000-0000-0000-000000000004'),
    ends_at = (SELECT ends_at FROM events WHERE id = 'e0000000-0000-0000-0000-000000000004')
WHERE id = 'e0000000-0000-0000-0000-000000000002';
