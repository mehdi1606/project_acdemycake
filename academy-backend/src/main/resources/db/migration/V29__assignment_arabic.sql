-- ── Bilingual assignments ───────────────────────────────────────────────────
-- title / description / instructions keep the English (default) text.
-- The *_ar columns hold the Arabic version; students see the one matching
-- their UI language, falling back to the other when a translation is empty.

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title_ar        VARCHAR(255);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description_ar  TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions_ar TEXT;
