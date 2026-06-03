-- V13 — Self-hosted video assets
-- Stores metadata for locally uploaded MP4 files and adds a fast-lookup
-- column on course_lessons so the streaming endpoint can resolve the path
-- with a single index scan.

CREATE TABLE video_assets (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id         UUID         NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    file_path         VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    content_type      VARCHAR(50)  NOT NULL DEFAULT 'video/mp4',
    file_size         BIGINT,
    duration_seconds  INTEGER,
    video_status      VARCHAR(20)  NOT NULL DEFAULT 'ready',
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP
);

CREATE INDEX idx_video_assets_lesson_id ON video_assets(lesson_id);

-- Quick-lookup column: avoids a JOIN for every streaming request
ALTER TABLE course_lessons
    ADD COLUMN IF NOT EXISTS video_file_path VARCHAR(500);
