-- Soft delete for users.
-- Hard-deleting a user fails with a FK conflict (409) because of their many child
-- records (payments, posts, comments, enrollments…) — and hard-deleting an instructor
-- would even cascade away other students' course data. Instead we flag the row as
-- deleted; Hibernate's @SQLRestriction hides it from every query (lists, counts, login).
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
