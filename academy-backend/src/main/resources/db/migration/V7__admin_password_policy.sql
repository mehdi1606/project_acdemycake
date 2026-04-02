-- V7: Add must_change_password flag; remove hardcoded admin seed from V2 history
--     Admin account is now bootstrapped via AdminBootstrapService at startup

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark any existing admin whose password hash matches the known-bad hash as must-change
-- (bcrypt of 'Admin@1234' starts with $2a$10$... pattern — mark all ADMIN accounts
--  created before this migration as requiring a password change)
UPDATE users
SET must_change_password = TRUE
WHERE role = 'ADMIN';
