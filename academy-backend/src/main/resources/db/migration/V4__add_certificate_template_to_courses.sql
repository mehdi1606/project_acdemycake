-- ============================================================
-- V4: Add certificate template support to courses
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_template_path VARCHAR(500);
