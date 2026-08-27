-- A MASTERCLASS can now be delivered in two ways:
--   RECORDED – paid online, student watches the curriculum (existing behaviour)
--   LIVE     – bespoke live session, reserved through WhatsApp, no curriculum
-- Existing masterclasses keep today's behaviour, so they default to RECORDED.
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS masterclass_format VARCHAR(20);

UPDATE courses
   SET masterclass_format = 'RECORDED'
 WHERE course_type = 'MASTERCLASS'
   AND masterclass_format IS NULL;

-- Seat limit for LIVE masterclasses ("places limitées"). NULL = no limit.
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS max_students INTEGER;

-- Single academy WhatsApp number used for live-masterclass reservations.
-- Empty until an admin sets it in Site Settings; the reserve button stays
-- hidden while it is blank so students are never sent to a dead number.
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('masterclass.whatsapp_number', '')
ON CONFLICT (setting_key) DO NOTHING;
