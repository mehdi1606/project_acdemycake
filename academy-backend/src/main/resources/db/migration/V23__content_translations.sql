-- Generic cache for machine-translated dynamic content (MyMemory, AR↔EN).
-- Keyed by a hash of the source text + target language, so identical text is
-- translated only once (ever) and reused across every entity.
CREATE TABLE IF NOT EXISTS content_translations (
    id          UUID         PRIMARY KEY,
    text_hash   VARCHAR(64)  NOT NULL,
    target_lang VARCHAR(8)   NOT NULL,
    source_lang VARCHAR(8),
    translated  TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP,
    CONSTRAINT uq_content_translation UNIQUE (text_hash, target_lang)
);
CREATE INDEX IF NOT EXISTS idx_content_translation_lookup
    ON content_translations (text_hash, target_lang);
