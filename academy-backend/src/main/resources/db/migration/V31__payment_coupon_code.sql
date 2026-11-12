-- V31 — Remember which coupon a checkout used.
-- The coupon is now only marked as used when the payment succeeds (previously it
-- was consumed as soon as the checkout form was generated, so a declined or
-- abandoned payment burned the coupon).
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
