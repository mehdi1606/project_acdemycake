-- Add multilingual translation columns for course title and description.
-- These are populated by the frontend translation API (MyMemory) when a course
-- is created or updated in Arabic or French.
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS title_ar        TEXT,
    ADD COLUMN IF NOT EXISTS title_fr        TEXT,
    ADD COLUMN IF NOT EXISTS description_ar  TEXT,
    ADD COLUMN IF NOT EXISTS description_fr  TEXT;
