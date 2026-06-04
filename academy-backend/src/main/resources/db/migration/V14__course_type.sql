-- V14 — Add course_type column to courses table
-- Distinguishes subscription-included courses (PLAN) from
-- individually-purchased masterclasses (MASTERCLASS).
-- All existing rows default to 'PLAN' for backward compatibility.

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_type VARCHAR(20) NOT NULL DEFAULT 'PLAN';

-- Back-fill any rows that may have landed without the column (safety net)
UPDATE courses SET course_type = 'PLAN' WHERE course_type IS NULL;
