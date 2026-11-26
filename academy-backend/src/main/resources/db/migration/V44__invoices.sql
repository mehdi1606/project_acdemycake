-- Invoices: one per successful payment, issued once and never changed.
--
-- Every value printed on the invoice is copied here at issue time (buyer, item,
-- amounts, VAT), so a later change to the user, the course title or the VAT
-- setting never alters an invoice already issued. Seller details are printed
-- from configuration (INVOICE_SELLER_*).
--
-- Numbering: SL-<year>-<6 digits>, gap-free per calendar year. The next number
-- comes from invoice_counters with an UPSERT that row-locks the year until the
-- issuing transaction commits; a rolled-back issue rolls the counter back too,
-- so no number is ever skipped (a plain sequence could leave gaps).
--
-- Backfill of existing COMPLETED payments is done by the application at startup
-- (InvoiceIssuer), in payment-date order, with the same code that issues live
-- invoices; this migration only creates the schema.

CREATE TABLE invoice_counters (
    invoice_year INTEGER PRIMARY KEY,
    last_number  INTEGER NOT NULL
);

CREATE TABLE invoices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number    VARCHAR(30)   NOT NULL,
    invoice_year      INTEGER       NOT NULL,
    sequence_number   INTEGER       NOT NULL,
    payment_id        UUID          NOT NULL REFERENCES payment_transactions(id),
    user_id           UUID          NOT NULL REFERENCES users(id),
    buyer_name        VARCHAR(255),
    buyer_email       VARCHAR(255),
    item_description  VARCHAR(500)  NOT NULL,
    payment_type      VARCHAR(30)   NOT NULL,
    payment_method    VARCHAR(100),
    order_reference   VARCHAR(100),
    payment_reference VARCHAR(100),
    currency          VARCHAR(3)    NOT NULL,
    amount_ht         NUMERIC(10,2) NOT NULL,
    vat_rate          NUMERIC(5,2)  NOT NULL,
    vat_amount        NUMERIC(10,2) NOT NULL,
    amount_ttc        NUMERIC(10,2) NOT NULL,
    issued_at         TIMESTAMP     NOT NULL,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_invoices_number UNIQUE (invoice_number),
    CONSTRAINT uk_invoices_payment UNIQUE (payment_id),
    CONSTRAINT uk_invoices_year_seq UNIQUE (invoice_year, sequence_number)
);

CREATE INDEX idx_invoices_user_id ON invoices (user_id, issued_at DESC);
CREATE INDEX idx_invoices_issued_at ON invoices (issued_at DESC);
