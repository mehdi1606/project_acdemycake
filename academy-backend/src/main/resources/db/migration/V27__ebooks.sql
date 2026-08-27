-- ── Ebooks: paid digital books, bought one-off without any subscription ──────
--
-- The PDF bytes are NOT referenced by URL here, only by file name. They live in
-- app.file.ebook-dir (outside ./uploads, which SecurityConfig exposes publicly
-- via /files/**), and are streamed only after an ebook_purchases row is found.

CREATE TABLE IF NOT EXISTS ebooks (
    id              UUID PRIMARY KEY,
    slug            VARCHAR(200)  NOT NULL UNIQUE,
    title           VARCHAR(300)  NOT NULL,
    title_en        TEXT,
    title_fr        TEXT,
    title_ar        TEXT,
    subtitle        VARCHAR(300),
    description     TEXT,
    description_en  TEXT,
    description_fr  TEXT,
    description_ar  TEXT,
    cover_url       VARCHAR(500),
    price           NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'MAD',
    page_count      INTEGER,
    pdf_en          VARCHAR(300),
    pdf_fr          VARCHAR(300),
    pdf_ar          VARCHAR(300),
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    display_order   INTEGER       DEFAULT 0,
    purchase_count  INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ebook_purchases (
    id             UUID PRIMARY KEY,
    user_id        UUID          NOT NULL REFERENCES users(id),
    ebook_id       UUID          NOT NULL REFERENCES ebooks(id),
    order_id       VARCHAR(100),
    amount_paid    NUMERIC(10,2),
    currency       VARCHAR(3)    NOT NULL DEFAULT 'MAD',
    purchased_at   TIMESTAMP     NOT NULL DEFAULT now(),
    download_count INTEGER       NOT NULL DEFAULT 0,
    created_at     TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP,
    CONSTRAINT uk_ebook_purchase_user_ebook UNIQUE (user_id, ebook_id)
);

CREATE INDEX IF NOT EXISTS idx_ebook_purchases_user  ON ebook_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_purchases_ebook ON ebook_purchases (ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_status         ON ebooks (status);

-- ── Seed the two existing titles ────────────────────────────────────────────
-- File names match what is already on disk in secure-storage/ebooks/.
-- Alchemy ships two editions (FR + AR); one purchase grants both.

INSERT INTO ebooks (
    id, slug, title, title_en, title_fr, title_ar, subtitle,
    description_en, description_fr, description_ar,
    price, currency, page_count, pdf_en, pdf_fr, pdf_ar, status, display_order
) VALUES (
    gen_random_uuid(),
    'cupcake-evolution-vol-1',
    'Cupcake Evolution Vol. 1',
    'Cupcake Evolution Vol. 1',
    'Cupcake Evolution Vol. 1',
    'تطور الكب كيك — المجلد 1',
    'Ebook of 10 flavors you''ve never met',
    '10 unique cupcake creations blending unexpected flavors with refined technique.',
    '10 créations uniques de cupcakes mêlant saveurs inattendues et techniques raffinées.',
    '10 إبداعات فريدة من الكب كيك تمزج بين النكهات غير المتوقعة والتقنيات الرفيعة.',
    799.00, 'MAD', 70,
    'cupcake-evolution-vol1-en.pdf', NULL, NULL,
    'PUBLISHED', 1
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO ebooks (
    id, slug, title, title_en, title_fr, title_ar, subtitle,
    description_en, description_fr, description_ar,
    price, currency, page_count, pdf_en, pdf_fr, pdf_ar, status, display_order
) VALUES (
    gen_random_uuid(),
    'alchemy-in-layers-vol-1',
    'Alchemy in Layers Vol. 1',
    'Alchemy in Layers Vol. 1',
    'Alchemy in Layers Vol. 1',
    'سحر الطبقات — المجلد 1',
    '10 signature layer cake recipes',
    '10 exclusive layer-cake recipes balancing flavour, elegance and stability.',
    '10 recettes exclusives de gâteaux à étages assurant saveur, élégance et stabilité.',
    '10 وصفات حصرية لكعكات متعددة الطبقات تضمن النكهة والأناقة والاستقرار.',
    799.00, 'MAD', 35,
    NULL, 'alchemy-in-layers-vol1-fr.pdf', 'alchemy-in-layers-vol1-ar.pdf',
    'PUBLISHED', 2
) ON CONFLICT (slug) DO NOTHING;
