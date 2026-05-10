-- Tiempo yerel / Docker PostgreSQL: tüm kullanıcı ve bağlı kayıtları siler.
-- flyway_schema_history tablosuna dokunmaz; migrasyon geçmişi kalır.
\set ON_ERROR_STOP on

BEGIN;

-- V11 uygulanmadıysa tablo olmayabilir; ana truncate başarısız olmasın.
DO $blk$
BEGIN
    EXECUTE 'TRUNCATE TABLE pending_signups RESTART IDENTITY CASCADE';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pending_signups tablosu yok (API ile Flyway V11 çalıştırın), atlandı';
END
$blk$;

TRUNCATE TABLE
    exchange_messages,
    reviews,
    user_notifications,
    time_transactions,
    exchange_requests,
    skills,
    users
RESTART IDENTITY CASCADE;

COMMIT;
