-- ─────────────────────────────────────────────────────────────────────────────
-- V11: Coupon system for Annual subscription plan
-- Note: FK constraints omitted here — JPA entity relationships enforce integrity.
--       ddl-auto:create recreates entity tables, so FKs pointing to users/coupons
--       would fail if those tables are recreated after this migration runs.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
    id               UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code             VARCHAR(50)     NOT NULL,
    discount_percent DECIMAL(5,2)    NOT NULL,
    max_uses         INTEGER,
    used_count       INTEGER         NOT NULL DEFAULT 0,
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    expires_at       TIMESTAMP,
    description      VARCHAR(255),
    created_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    CONSTRAINT uq_coupons_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);

CREATE TABLE IF NOT EXISTS coupon_usages (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id   UUID        NOT NULL,
    user_id     UUID        NOT NULL,
    used_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    CONSTRAINT uq_coupon_usages_coupon_user UNIQUE (coupon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages (coupon_id, user_id);
