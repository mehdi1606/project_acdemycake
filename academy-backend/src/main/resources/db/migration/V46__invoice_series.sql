-- Two invoice series.
--
--   Archive (series 'A'):  everything paid before 2026-11-26 00:00 Africa/Casablanca,
--                          numbered SL-A-0001, SL-A-0002 ... in date order.
--   Main    (series 'MAIN'): everything paid from that moment on, numbered
--                          SL-<year>-000001 ... gap-free per calendar year.
--
-- Archive rows use invoice_year = 0 so their numbers never collide with the main
-- series in the (invoice_year, sequence_number) unique index, and the archive
-- counter is invoice_counters row 0. Dates, amounts and every other snapshot
-- column are left untouched; only series and numbers change.
--
-- Timestamps are stored as wall-clock times of the application's JVM. The JDBC
-- driver sets this session's TimeZone to that same JVM zone, so the cutoff below
-- is expressed in it: 2026-11-26 00:00 Casablanca, converted to the stored clock.
-- From now on the application assigns the series itself (app.invoice.series-cutoff);
-- a late pre-cutoff payment goes to the end of the archive.

ALTER TABLE invoices ADD COLUMN series VARCHAR(10) NOT NULL DEFAULT 'MAIN';

CREATE TEMP TABLE invoice_cutoff ON COMMIT DROP AS
SELECT (TIMESTAMPTZ '2026-11-26 00:00:00 Africa/Casablanca'
        AT TIME ZONE current_setting('TimeZone')) AS ts;

UPDATE invoices SET series = 'A'
WHERE issued_at < (SELECT ts FROM invoice_cutoff);

-- 1. Park every number out of the way (negative sequence, temporary number),
--    so the renumbering below can never hit a unique-index collision.
UPDATE invoices
SET sequence_number = -sequence_number,
    invoice_number  = 'TMP-' || invoice_year || '-' || sequence_number;  -- unique, fits VARCHAR(30)

-- 2. Archive: one sequence in date order, year 0.
WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY issued_at, -sequence_number, created_at, id) AS seq
    FROM invoices WHERE series = 'A'
)
UPDATE invoices i
SET invoice_year    = 0,
    sequence_number = o.seq,
    invoice_number  = 'SL-A-' || CASE WHEN o.seq < 10000 THEN LPAD(o.seq::text, 4, '0') ELSE o.seq::text END
FROM ordered o WHERE o.id = i.id;

-- 3. Main: from 1 in each calendar year (Casablanca calendar), in date order.
WITH main AS (
    SELECT id, issued_at, sequence_number, created_at,
           EXTRACT(YEAR FROM (issued_at AT TIME ZONE current_setting('TimeZone'))
                             AT TIME ZONE 'Africa/Casablanca')::int AS yr
    FROM invoices WHERE series = 'MAIN'
), ordered AS (
    SELECT id, yr,
           ROW_NUMBER() OVER (PARTITION BY yr ORDER BY issued_at, -sequence_number, created_at, id) AS seq
    FROM main
)
UPDATE invoices i
SET invoice_year    = o.yr,
    sequence_number = o.seq,
    invoice_number  = 'SL-' || o.yr || '-' || CASE WHEN o.seq < 1000000 THEN LPAD(o.seq::text, 6, '0') ELSE o.seq::text END
FROM ordered o WHERE o.id = i.id;

-- 4. Counters follow the renumbered rows: row 0 = archive, one row per main year
--    (2026 is kept, at 0 if no main invoice exists yet).
DELETE FROM invoice_counters;
INSERT INTO invoice_counters (invoice_year, last_number)
SELECT invoice_year, MAX(sequence_number) FROM invoices GROUP BY invoice_year;
INSERT INTO invoice_counters (invoice_year, last_number) VALUES (2026, 0)
ON CONFLICT (invoice_year) DO NOTHING;

ALTER TABLE invoices
    ADD CONSTRAINT ck_invoices_series CHECK (series IN ('A', 'MAIN')),
    ADD CONSTRAINT ck_invoices_series_year CHECK ((series = 'A') = (invoice_year = 0)),
    ADD CONSTRAINT ck_invoices_positive_seq CHECK (sequence_number > 0);

CREATE INDEX idx_invoices_series_issued ON invoices (series, issued_at DESC);
