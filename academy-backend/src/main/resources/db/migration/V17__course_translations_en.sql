-- Add English translation columns so courses created in Arabic/French
-- can store a translated English version.
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS title_en        TEXT,
    ADD COLUMN IF NOT EXISTS description_en  TEXT;
