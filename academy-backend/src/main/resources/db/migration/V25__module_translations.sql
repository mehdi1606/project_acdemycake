ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS title_ar VARCHAR(255);
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS description_ar TEXT;
