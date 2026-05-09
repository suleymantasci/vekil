# Vekil - Otonom Apartman ve Site Yönetimi SaaS

## Proje Yapısı

```
vekil/
├── server/               # NestJS Backend
│   ├── src/
│   │   ├── auth/         # Kimlik doğrulama (JWT, register, login, refresh)
│   │   ├── users/        # Kullanıcı yönetimi
│   │   ├── organizations/ # Organizasyon (tenant) yönetimi
│   │   ├── buildings/    # Bina/site yönetimi
│   │   ├── apartments/   # Daire yönetimi
│   │   ├── roles/        # Rol ve izin sistemi
│   │   └── common/       # Paylaşılan (DTOs, interceptors, filters)
│   └── prisma/           # Veritabanı şeması ve migrations
│
├── client/               # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/          # App Router sayfaları
│   │   ├── components/   # React bileşenleri
│   │   ├── lib/          # API client, utility fonksiyonları
│   │   └── types/        # TypeScript tip tanımları
│
├── docker-compose.yml    # Docker orchestration
├── .github/workflows/    # CI/CD pipeline
└── SPEC.md              # Proje blueprint (bu dosya)
```

## Kurulum

### Gereksinimler
- Node.js 22+
- PostgreSQL 15+
- Docker (opsiyonel)

### 1. Server Kurulumu

```bash
cd server
cp .env.example .env  # Database URL ve JWT_SECRET ayarla
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 2. Client Kurulumu

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

### 3. Docker ile Çalıştırma

```bash
docker compose up -d
```

## Environment Variables

### Server (.env)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT imzalama anahtarı
- `CORS_ORIGIN` — İzin verilen origin'ler

### Client (.env.local)
- `NEXT_PUBLIC_API_URL` — Backend API adresi
- `NEXT_PUBLIC_APP_URL` — Frontend URL

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Organizasyon + admin kullanıcı oluşturma
- `POST /api/v1/auth/login` — Giriş (JWT token al)
- `POST /api/v1/auth/refresh` — Token yenileme

### Buildings
- `GET /api/v1/buildings` — Liste (sayfalama destekli)
- `POST /api/v1/buildings` — Oluşturma
- `PUT /api/v1/buildings/:id` — Güncelleme
- `DELETE /api/v1/buildings/:id` — Pasif yapma

### Apartments
- `GET /api/v1/apartments?buildingId=` — Bina'ya ait daireler
- `POST /api/v1/apartments` — Daire oluşturma
- `POST /api/v1/apartments/batch` — Toplu CSV import

### Users
- `GET /api/v1/users` — Liste
- `POST /api/v1/users` — Oluşturma
- `PUT /api/v1/users/:id` — Güncelleme
- `DELETE /api/v1/users/:id` — Soft delete

## Deployment

### GitHub Actions (Otomatik)
1. `main` branch'e push yapılır
2. Server + Client CI kontrolleri çalışır (tsc, lint, test)
3. Testler başarılı olursa hostinger'a deploy edilir

### Manuel Deploy
```bash
ssh root@hostinger
cd vekil
git pull origin main
docker compose up -d --build
```

## Domain & SSL

- **Domain:** vekil.tasci.cloud
- **SSL:** Let's Encrypt (Traefik otomatik)
- **Traefik:** Hostinger'da çalışan ters proxy

## Ek Geliştirici Notları

- Tüm API yanıtları `{ success, data, error, meta }` formatındadır
- Audit log tüm UPDATE/DELETE işlemlerini takip eder
- RLS multi-tenant izolasyonu veritabanı seviyesinde
- JWT token 15 dakika, refresh token 7 gün geçerli