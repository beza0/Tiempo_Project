-- TransactionType'a PURCHASE eklendi (satın alma defter kaydı).
-- Hibernate, time_transactions.type için ('EARN','SPEND') CHECK kısıtı oluşturmuş olabilir; bu kısıt
-- yeni değeri reddeder. Kısıt adı sürüme göre değiştiğinden 'type' içeren CHECK'ler kaldırılır (bkz. V12).
-- Tablo yoksa (boş şema) hiçbir şey yapmaz. Veriyi değiştirmez.
DO $mig$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = current_schema()
      AND t.relname = 'time_transactions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE time_transactions DROP CONSTRAINT %I', con.conname);
  END LOOP;
END
$mig$;
