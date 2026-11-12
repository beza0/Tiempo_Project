# Tiempos

Zaman bankası / topluluk oturumları için tam yığın monorepo: **React (Vite)** web arayüzü, **Spring Boot** REST API, **PostgreSQL** ve **Flutter** mobil istemci (Android, iOS ve **Flutter Web**).

---

## Monorepo yapısı

| Klasör | Açıklama |
|--------|----------|
| `frontend/` | Vite + React + TypeScript — `npm run dev` |
| `backend/` | Spring Boot + Maven — `npm run backend:run` veya Docker |
| `mobil/` | Flutter uygulaması — Android / iOS / **Chrome (Web)** |
| `scripts/` | Yerel geliştirme yardımcıları (`start-local-backend.sh` vb.) |

Ayrıntılı mobil dokümantasyon: [`mobil/README.md`](mobil/README.md).

---

## Ortam değişkenleri

Yerel ve Docker için kök şablon: **[`.env.example`](.env.example)**  
Kullanım: `cp .env.example .env` — ardından özellikle `GOOGLE_CLIENT_ID` (Web OAuth istemcisi) ve isteğe bağlı Brevo alanlarını doldurun.

---

## Docker ile çalıştırma (önerilen tam yığın)

**Gereksinim:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (veya Docker Engine + Compose v2).

Proje kökünde:

```bash
docker compose up -d --build
```

veya `npm run docker:up`

| Servis | Adres / not |
|--------|----------------|
| PostgreSQL (makine) | `localhost:5433` → konteyner içi `5432` (yerel 5432 çakışmasını önlemek için) |
| Kullanıcı / şifre / DB | `timebank_user` / `1234` / `timebank` |
| API | `http://localhost:8080` |
| Web (nginx) | `http://localhost:3000` |

Ardından **yalnızca** React arayüzünü ayrı geliştirmek için:

```bash
npm install --prefix frontend
npm run dev
```

### Yalnızca veritabanı (Spring’i Maven ile çalıştırmak için)

```bash
docker compose up -d db
```

veya `npm run docker:db` — sonra `npm run backend:run`.

**Dikkat:** `tiempos-api` konteyneri **8080** kullanıyorsa aynı anda `npm run backend:run` çalıştırmayın. Yerel Maven için: `npm run docker:stop-api` veya `docker compose stop api`.

### Durdurma

```bash
docker compose down
```

veya `npm run docker:down`. Veriyi de silmek için: `docker compose down -v`.

---

## Flutter mobil — Web (Chrome)

Flutter Web, React ile **aynı Spring API**’yi (`/api/...`) kullanır. Geliştirme için **sabit port** kullanın; aksi halde Google Sign-In `origin_mismatch` verir.

### Gereksinimler

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (projede `sdk: ^3.10.8`)
- Docker Desktop (yerel API + Postgres için) veya yalnızca erişebildiğiniz bir API URL’si

### Önerilen akış: yerel API + Chrome (iki terminal)

**1. Terminal — repo kökü** (Postgres + Spring Boot `http://localhost:8080`):

```bash
./scripts/start-local-backend.sh
```

Kök `.env` içinde `GOOGLE_CLIENT_ID` tanımlıysa script bunu backend’e aktarır (`/api/auth/google-config`).

**2. Terminal — Flutter Web** (`http://localhost:9339` → API `http://localhost:8080`):

```bash
cd mobil
./run_local_chrome.sh
```

Bu script `.env`’deki `GOOGLE_CLIENT_ID` varsa `--dart-define` ile web istemcisine iletir.

### Sadece Render API ile (backend çalıştırmadan)

```bash
cd mobil
flutter pub get
./run_chrome.sh
```

Varsayılan API: `https://tiempos-backend-w26e.onrender.com` (uyku sonrası ilk istek 60–120 sn sürebilir).

### Google Cloud Console

[Google Cloud Console](https://console.cloud.google.com/) → **API’ler ve Hizmetler** → **Kimlik bilgileri** → **OAuth 2.0 Web istemcisi** → **Yetkili JavaScript kökenleri**:

| Ortam | Köken |
|--------|--------|
| Flutter Web (bu repo) | `http://localhost:9339` (gerekirse ayrıca `http://127.0.0.1:9339`) |
| Vite | `http://localhost:5173`, `http://127.0.0.1:5173` |
| Docker web | `http://localhost:3000` |

`GOOGLE_CLIENT_ID` ile **aynı** Web istemci kimliğini backend ve (gerekiyorsa) `VITE_GOOGLE_CLIENT_ID` ile frontend’de kullanın.

### Sık yapılan hatalar

| Hata | Çözüm |
|------|--------|
| `No pubspec.yaml file found` | `flutter run` komutunu **repo kökünde değil** `mobil/` içinde çalıştırın veya `./run_chrome.sh` / `./run_local_chrome.sh` kullanın. |
| `cd: no such file or directory: /path/to/...` | Dokümandaki `/path/to/...` yalnızca örnektir; kendi proje yolunuzu kullanın. |
| Google `origin_mismatch` / GSI 403 | Sabit port (`--web-port=9339`) ve Console’da **tam** köken (şema + host + port). |
| CORS / `Invalid CORS request` | Yerel API kullanırken kök `.env` veya `docker compose` ile `CORS_ALLOWED_ORIGINS` içinde `http://localhost:9339` olduğundan emin olun (`.env.example` ve güncel `docker-compose.yml` varsayılanlarına bakın). |

---

## Google ile giriş ve e-posta (React / genel)

- **GSI:** `The given origin is not allowed for the given client ID` → yukarıdaki **Yetkili JavaScript kökenleri** listesini kontrol edin.
- **Aynı Web client ID:** `GOOGLE_CLIENT_ID` (backend `aud` doğrulaması) ve `VITE_GOOGLE_CLIENT_ID`. Yerelde `GOOGLE_REQUIRE_CLIENT_ID=false` iken backend `aud` gevşetilebilir; tarayıcıdaki GSI yine Console kayıtlarına bağlıdır.
- **`GET /api/skills` veya `POST /api/auth/social-login` 500** → Vite `DEV_API_PROXY` (varsayılan `http://localhost:8080`). Portta yanlış süreç varsa `npm run dev` çıktısındaki `[tiempos]` uyarısına bakın; `DEV_API_PROXY` veya Docker API’yi düzeltin.
- **Doğrulama e-postası gelmiyorsa:** `BREVO_API_KEY` veya geçerli SMTP, `APP_MAIL_ENABLED=true`, `APP_MAIL_FROM` doğrulanmış gönderici.

---

## Sorun giderme (genel)

- **`Bind for 0.0.0.0:5432 failed`** — Bu projede Docker DB **5433** üzerinden yayınlanır.
- **`Dockerfile: no such file or directory`** — Komutları **repo kökünden** çalıştırın.
- **`role "timebank_user" does not exist`** — Önce `docker compose up -d db`, sonra `npm run backend:run` veya `./scripts/start-local-backend.sh`.
- **8080 kullanımda** — `tiempos-api` ile yerel Maven aynı anda çalışmasın (`npm run docker:stop-api`).
- **`./mvnw test` / Testcontainers** — Docker **29+** ve çalışan daemon; ayrıntı için `backend` README / CI.

## PostgreSQL’i Docker kullanmadan

`jdbc:postgresql://localhost:5432/...` kullanıyorsanız kullanıcı ve veritabanı oluşturun:

```sql
CREATE USER timebank_user WITH PASSWORD '1234';
CREATE DATABASE timebank OWNER timebank_user;
```

Spring’deki `SPRING_DATASOURCE_URL` ile uyumlu olmalıdır.

---

## Kökten npm kısayolları

| Komut | Açıklama |
|--------|----------|
| `npm run dev` | Vite (frontend) |
| `npm run build` | Frontend production build |
| `npm run backend:run` | Spring Boot (yerel JVM; DB ayrıca gerekir) |
| `npm run docker:up` | Docker: DB + API |
| `npm run docker:db` | Docker: yalnızca PostgreSQL |
| `npm run docker:down` | Docker servislerini durdur |
| `npm run docker:stop-api` | Yalnızca API konteyneri (8080’i boşaltır) |
| `npm run test:unit` | Frontend Vitest |
| `npm run test:e2e` | Playwright smoke |
| `npm run test:backend` | Backend entegrasyon (Testcontainers; Docker gerekir) |
| `npm run ci` | Lint + unit + build + backend test |

İsteğe bağlı: `frontend/.env` içinde `VITE_API_BASE_URL=http://localhost:8080` (sonunda `/api` yok).

---

## Canlı (Render API)

Üretimde API ortam değişkenleri için özet:

| Değişken | Öneri |
|----------|--------|
| `TIEMPOS_PRE_SESSION_DEMO` | `false` |
| `PAYMENT_MODE` | `redirect` (varsayılan): doğrulanmış ödeme sağlayıcısı entegrasyonu olmadığı için **saat satın alma kapalıdır** (checkout/complete 409). `demo` yalnızca yerel/test içindir — ödeme alınmadan kredi ekler. |
| `JPA_SHOW_SQL` | `false` |
| `CORS_ALLOWED_ORIGINS` | Canlı domainleriniz |
| `GOOGLE_CLIENT_ID` | Web istemcisi (prod) |

Yerel profil: `SPRING_PROFILES_ACTIVE=local` (`.env.example`) — demo ödeme, SQL log, geliştirici CORS.

Yeni migration: `V22__time_transactions_type_purchase.sql` (yalnızca `time_transactions.type` üzerindeki Hibernate CHECK kısıtını kaldırır; veri değiştirmez).

---

## Test ve CI

**GitHub Actions** (`.github/workflows/ci.yml`): backend `mvn test` (Docker) ve frontend lint, Vitest, build, Playwright.

```bash
npm run test:unit
npm run test:backend
npm run test:e2e
npm run ci
```

---

*English summary:* Use **Docker Compose** for PostgreSQL and the API; use **`./scripts/start-local-backend.sh`** + **`mobil/run_local_chrome.sh`** for **Flutter Web** against a local API on **port 9339** with Google OAuth origins configured accordingly.
