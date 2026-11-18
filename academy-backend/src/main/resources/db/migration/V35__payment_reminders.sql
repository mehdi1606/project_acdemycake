-- ── Unfinished-payment reminders ────────────────────────────────────────────
-- A PENDING payment gets up to 3 reminder emails, then is cancelled
-- automatically (PendingPaymentReminderJob). reminder_count counts the emails
-- sent; last_reminder_at is when the last one went out.
--
-- Payments that were already PENDING before this feature are marked -1: those
-- customers are never emailed out of the blue about old checkouts, and their
-- rows are left exactly as they are.

ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS reminder_count   INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP;

UPDATE payment_transactions SET reminder_count = -1 WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_payment_tx_pending_reminders
    ON payment_transactions (created_at)
    WHERE status = 'PENDING' AND reminder_count >= 0;
