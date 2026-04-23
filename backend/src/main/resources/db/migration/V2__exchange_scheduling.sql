-- Oturum zamanı + hatırlatıcı bayrağı (eski volume uyumluluğu)
ALTER TABLE exchange_requests ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ;
ALTER TABLE exchange_requests ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;
