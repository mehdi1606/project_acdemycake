-- Cake challenges (first one: New Year Cake Challenge 2027).
-- Flow: register -> submit 3-5 photos -> admin approval -> weighted votes -> results.
-- Dates are absolute instants (TIMESTAMPTZ).

CREATE TABLE challenges (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                  VARCHAR(80)  NOT NULL UNIQUE,
    submissions_open_at   TIMESTAMPTZ  NOT NULL,
    submissions_close_at  TIMESTAMPTZ  NOT NULL,
    voting_open_at        TIMESTAMPTZ  NOT NULL,
    voting_close_at       TIMESTAMPTZ  NOT NULL,
    results_at            TIMESTAMPTZ  NOT NULL,
    banner_until          TIMESTAMPTZ  NOT NULL,
    min_photos            INTEGER      NOT NULL DEFAULT 3,
    max_photos            INTEGER      NOT NULL DEFAULT 5,
    min_voters            INTEGER      NOT NULL DEFAULT 3,
    active                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP
);

CREATE TABLE challenge_registrations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id  UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP,
    CONSTRAINT uq_challenge_registration UNIQUE (challenge_id, user_id)
);

CREATE TABLE challenge_entries (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id         UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                VARCHAR(120) NOT NULL,
    description          TEXT,
    photos_json          TEXT NOT NULL,
    certified            BOOLEAN NOT NULL DEFAULT FALSE,
    publication_consent  BOOLEAN NOT NULL DEFAULT FALSE,
    status               VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_note           TEXT,
    reviewed_at          TIMESTAMP,
    reviewed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP,
    CONSTRAINT uq_challenge_entry UNIQUE (challenge_id, user_id)
);
CREATE INDEX idx_challenge_entries_status ON challenge_entries (challenge_id, status);

CREATE TABLE challenge_votes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id       UUID NOT NULL REFERENCES challenge_entries(id) ON DELETE CASCADE,
    voter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points         INTEGER NOT NULL,
    voter_role     VARCHAR(20) NOT NULL,
    ip_address     VARCHAR(64),
    voided         BOOLEAN NOT NULL DEFAULT FALSE,
    voided_reason  VARCHAR(300),
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP,
    CONSTRAINT uq_challenge_vote UNIQUE (entry_id, voter_id)
);
CREATE INDEX idx_challenge_votes_entry ON challenge_votes (entry_id);
CREATE INDEX idx_challenge_votes_voter ON challenge_votes (voter_id);

-- The New Year Cake Challenge 2027, in Morocco local time. Morocco is on UTC+0 this winter (checked
-- against the live clock); the offset is written out so no time-zone database can shift it.
INSERT INTO challenges (slug, submissions_open_at, submissions_close_at, voting_open_at, voting_close_at, results_at, banner_until)
VALUES ('new-year-cake-2027',
        TIMESTAMPTZ '2026-11-25 00:00:00+00',
        TIMESTAMPTZ '2026-12-25 23:59:59+00',
        TIMESTAMPTZ '2026-12-26 00:00:00+00',
        TIMESTAMPTZ '2027-01-01 23:59:59+00',
        TIMESTAMPTZ '2027-01-05 00:00:00+00',
        TIMESTAMPTZ '2027-01-20 00:00:00+00');
