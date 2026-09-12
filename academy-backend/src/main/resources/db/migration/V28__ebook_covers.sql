-- ── Ebook covers ────────────────────────────────────────────────────────────
-- Covers are the first page of each PDF, shipped as public frontend assets
-- (template/public/assets/img/ebooks). They are not paid content, so they do
-- not belong in secure-storage. A path starting with "/" is returned as-is by
-- EbookServiceImpl instead of being prefixed with /files/.
-- Only fills empty covers, so an admin-set cover is never overwritten.

UPDATE ebooks SET cover_url = '/assets/img/ebooks/cupcake-evolution-vol1.webp'
 WHERE slug = 'cupcake-evolution-vol-1' AND (cover_url IS NULL OR cover_url = '');

UPDATE ebooks SET cover_url = '/assets/img/ebooks/alchemy-in-layers-vol1.webp'
 WHERE slug = 'alchemy-in-layers-vol-1' AND (cover_url IS NULL OR cover_url = '');
