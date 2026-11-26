-- Invoices for masterclass participants paid outside the platform (WhatsApp,
-- bank transfer, cash) and added by hand (masterclass_manual_bookings).
--
-- An invoice now belongs to exactly one source: a card payment OR a manual
-- booking. A manual booking may have no linked account, so user_id becomes
-- optional; the buyer's phone is snapshotted for buyers without an email.
-- Numbering is unchanged: the same SL-<year>-NNNNNN sequence, shared by both
-- sources. Existing manual bookings are invoiced by the application at startup
-- (InvoiceIssuer), interleaved by date with card payments.

ALTER TABLE invoices ALTER COLUMN payment_id DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE invoices
    ADD COLUMN manual_booking_id UUID REFERENCES masterclass_manual_bookings(id),
    ADD COLUMN buyer_phone VARCHAR(30);

ALTER TABLE invoices
    ADD CONSTRAINT uk_invoices_manual_booking UNIQUE (manual_booking_id),
    ADD CONSTRAINT ck_invoices_one_source
        CHECK ((payment_id IS NULL) <> (manual_booking_id IS NULL));
