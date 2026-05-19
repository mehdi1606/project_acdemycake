-- ─── Contact Messages ─────────────────────────────────────────────────────────
-- Stores public contact form submissions (no auth required to submit)

CREATE TABLE contact_messages (
    id         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    phone      VARCHAR(30),
    subject    VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_created_at ON contact_messages (created_at DESC);
CREATE INDEX idx_contact_is_read    ON contact_messages (is_read);
