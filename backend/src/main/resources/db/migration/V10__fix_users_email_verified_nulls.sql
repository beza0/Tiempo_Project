-- Hibernate ddl-auto bazen email_verified eklerken DEFAULT kullanmaz; mevcut satırlarda NULL kalır ve NOT NULL başarısız olur.
DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'email_verified'
    ) THEN
        UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
        ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT TRUE;
        ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
    END IF;
END
$migration$;
