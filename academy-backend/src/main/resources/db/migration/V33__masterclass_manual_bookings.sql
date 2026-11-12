-- V33 — Participants added by the instructor for LIVE masterclasses that were
-- reserved on WhatsApp and paid outside the platform (cash, bank transfer...).
-- Purely additive: a new table, nothing existing is changed.
CREATE TABLE IF NOT EXISTS masterclass_manual_bookings (
    id            UUID PRIMARY KEY,
    course_id     UUID         NOT NULL REFERENCES courses(id),
    user_id       UUID         REFERENCES users(id),
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30),
    email         VARCHAR(255),
    amount_paid   NUMERIC(10,2),
    currency      VARCHAR(3)   NOT NULL DEFAULT 'MAD',
    note          VARCHAR(500),
    added_by      UUID         REFERENCES users(id),
    cancelled_at  TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mc_manual_bookings_course
    ON masterclass_manual_bookings (course_id) WHERE cancelled_at IS NULL;
