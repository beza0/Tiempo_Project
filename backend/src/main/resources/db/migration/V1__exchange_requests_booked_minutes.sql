-- Eski veritabanlarında exchange_requests.booked_minutes eksik olabiliyor (Hibernate update her ortamda eklemiyor).
-- Tablo yoksa (Flyway Hibernate'den önce çalışırsa) hiçbir şey yapılmaz; Hibernate tabloyu güncel entity ile oluşturur.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = 'exchange_requests'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'exchange_requests' AND column_name = 'booked_minutes'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN booked_minutes INTEGER NOT NULL DEFAULT 60;
  END IF;
END
$migration$;
