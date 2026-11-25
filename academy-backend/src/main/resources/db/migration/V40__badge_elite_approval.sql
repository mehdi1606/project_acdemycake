-- Elite (top) badge: needs the chef's personal approval on top of the numbers.
-- Set/cleared by an admin from the users list; NULL = not approved.
ALTER TABLE users ADD COLUMN IF NOT EXISTS elite_approved_at TIMESTAMP;
