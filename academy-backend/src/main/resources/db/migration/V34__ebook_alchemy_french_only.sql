-- ── Alchemy in Layers: French edition only ──────────────────────────────────
-- The Arabic edition is withdrawn. Only the PDF link is cleared: the Arabic
-- title/description stay so the book still displays properly in the Arabic UI.
-- Purchases are per title, so every existing buyer keeps access (French PDF).
-- page_count is corrected to the real French PDF (39 pages).

UPDATE ebooks
   SET pdf_ar = NULL,
       page_count = 39
 WHERE slug = 'alchemy-in-layers-vol-1';
