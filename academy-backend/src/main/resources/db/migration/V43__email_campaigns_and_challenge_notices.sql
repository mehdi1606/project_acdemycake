-- Announcement emails to all members, sent in the background under a daily cap
-- (Gmail SMTP allows ~500 a day). One row per campaign and one per recipient, so
-- nobody ever gets the same campaign twice, even across restarts.

CREATE TABLE email_campaigns (
    key          VARCHAR(80) PRIMARY KEY,
    status       VARCHAR(20) NOT NULL DEFAULT 'IDLE',   -- IDLE, SENDING, DONE
    launched_at  TIMESTAMP,
    finished_at  TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP
);

CREATE TABLE email_campaign_sends (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign    VARCHAR(80) NOT NULL REFERENCES email_campaigns(key) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL,                    -- SENT, FAILED, SKIPPED
    error       VARCHAR(300),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP,
    CONSTRAINT uq_campaign_user UNIQUE (campaign, user_id)
);
CREATE INDEX idx_campaign_sends_created ON email_campaign_sends (created_at);

INSERT INTO email_campaigns (key) VALUES ('platform-update-2026-11'), ('challenge-open-2027');

-- The challenge tells everyone once when voting opens and once when results are out.
ALTER TABLE challenges ADD COLUMN voting_notified_at TIMESTAMPTZ;
ALTER TABLE challenges ADD COLUMN results_notified_at TIMESTAMPTZ;
