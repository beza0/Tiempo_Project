-- SMTP ile kayıt: doğrulama kodu gelene kadar gerçek users satırı oluşmaz.
CREATE TABLE IF NOT EXISTS pending_signups (
    id UUID PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    full_name VARCHAR(80) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups (email);
