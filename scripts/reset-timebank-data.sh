#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose exec -T db psql -U timebank_user -d timebank < "$ROOT/scripts/reset-timebank-data.sql"
echo "Tamam: users ve bağlı tablolar boşaltıldı. Kayıtları sıfırdan oluşturabilirsiniz."
