-- Black Friday 2026: the Annual plan costs 899 MAD for 24 hours (Morocco time, UTC+1).
-- Outside this window the normal subscription.yearly_price applies (renewals included).
INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES
  ('promo.id',           'blackfriday-2026',          now()),
  ('promo.theme',        'blackfriday',               now()),
  ('promo.yearly_price', '899',                       now()),
  ('promo.starts_at',    '2026-11-20T00:00:00+01:00', now()),
  ('promo.ends_at',      '2026-11-21T00:00:00+01:00', now())
ON CONFLICT (setting_key) DO NOTHING;
