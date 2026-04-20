ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_verification_token
    ON users (email_verification_token)
    WHERE email_verification_token IS NOT NULL;
