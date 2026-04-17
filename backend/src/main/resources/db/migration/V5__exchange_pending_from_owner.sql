ALTER TABLE exchange_requests
    ADD COLUMN IF NOT EXISTS pending_from_owner BOOLEAN NOT NULL DEFAULT false;
