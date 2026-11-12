-- V30 — Session details for LIVE masterclasses + index for seat-hold lookups.
--
-- A LIVE masterclass now has a real schedule and venue, and can be paid online
-- by card (CMI) as well as reserved on WhatsApp. All columns are nullable so
-- existing courses and recorded masterclasses are unaffected.

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS session_date       DATE,
    ADD COLUMN IF NOT EXISTS session_start_time TIME,
    ADD COLUMN IF NOT EXISTS session_end_time   TIME,
    ADD COLUMN IF NOT EXISTS session_location   VARCHAR(500);

-- Seat availability counts pending (not yet expired) card payments as held
-- seats, so it filters payment_transactions by reference + type + status.
CREATE INDEX IF NOT EXISTS idx_payment_transactions_ref_type_status
    ON payment_transactions (reference_id, transaction_type, status);
