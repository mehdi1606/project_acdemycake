-- Generic key/value store for admin-editable platform settings (dynamic config).
-- First use: subscription pricing, so the admin can change prices without a redeploy.
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value TEXT        NOT NULL,
    updated_at    TIMESTAMP   NOT NULL DEFAULT now()
);

-- Seed with the current config defaults so existing behaviour is preserved.
-- (The admin can change these from the Site Settings page afterwards.)
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('subscription.monthly_price', '390.00'),
    ('subscription.yearly_price',  '3900.00')
ON CONFLICT (setting_key) DO NOTHING;
