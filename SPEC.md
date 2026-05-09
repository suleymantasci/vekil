# Vekil — Otonom Apartman ve Site Yönetimi SaaS

**Proje:** Vekil  
**Domain:** vekil.tasci.cloud  
**GitHub:** github.com/suleymantasci/vekil  
**Durum:** Planlama

---

## 1. Concept & Vision

Vekil, apartman/site/rezidans yönetiminde %100 otonom iletişim ve sıfır yönetimsel hata mottosuyla yola çıkan bir SaaS platformudur. Sakinler WhatsApp üzerinden borç sorgular, arıza bildirimi yapar ve rezervasyon oluşturur — yönetici müdahalesi minimuma indirilir. Yapay zeka destekli chatbot KVKK uyumlu, hukuki delil niteliğinde loglanmış ve tamamen çoklu kiracılı (multi-tenant) bir altyapıda çalışır.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js + NestJS + Prisma ORM |
| Veritabanı | PostgreSQL + PostGIS (RLS multi-tenant) |
| Frontend | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| AI | OpenAI/Gemini API (RAG) |
| Mesaj Kuyruğu | Redis + BullMQ |
| Bildirim | WhatsApp Business API, Twilio (SMS), SendGrid (Email) |
| Deployment | Docker + CI/CD (GitHub Actions) |

---

## 3. Faz Planı

### Faz 1 — Çekirdek Altyapı ✅
- [ ] Multi-tenant PostgreSQL + Row-Level Security (RLS)
- [ ] NestJS proje yapısı + Prisma şeması
- [ ] JWT Auth (login, register, refresh token)
- [ ] Organization/Building/Apartment modelleri
- [ ] User + Role + Permission sistemi
- [ ] CI/CD pipeline (GitHub Actions → hostinger)

### Faz 2 — Finans Motoru + WhatsApp
- [ ] Tahakkuk (aidat borçlandırma) motoru
- [ ] KMK 20. madde gecikme faizi (%5/ay, günlük işletim)
- [ ] WhatsApp Business API entegrasyonu
- [ ] KVKK opt-in onay mekanizması
- [ ] Borç/sorgu endpoint'leri (WhatsApp chatbot)

### Faz 3 — AI Chatbot + Teknik Servis
- [ ] RAG tabanlı WhatsApp chatbot (OpenAI/Gemini)
- [ ] Arıza bildirimi → iş emri dönüşümü
- [ ] Demirbaş (asset) yönetimi
- [ ] QR kodlu teknik servisi kontrolü

### Faz 4 — Operasyon ve Sakin Deneyimi
- [ ] Rezervasyon sistemi (tesis, kort, otopark)
- [ ] İhale ve satın alma modulü
- [ ] Ziyaretçi yönetimi (QR kodlu davetiye)
- [ ] Dijital genel kurul ve oylama

### Faz 5 — GEO/SEO ve Rakip Analizi
- [ ] PostGIS geo-fencing (personel konum doğrulama)
- [ ] Next.js SSR + JSON-LD structured data
- [ ] RAKIP ANALİZİ → eksik modüllerin tespiti
- [ ] Ek modüllerin eklenmesi

---

## 4. Veritabanı Modelleri (Faz 1)

### Organization
```
id: UUID (PK)
name: string
slug: string (unique)
createdAt, updatedAt
```

### Building
```
id: UUID (PK)
organizationId: UUID (FK)
name: string
address: string
lat, lng (PostGIS)
createdAt, updatedAt
```

### Apartment (Daire)
```
id: UUID (PK)
buildingId: UUID (FK)
number: string
floor: int
areaM2: float
shareRatio: float (arsa payı)
createdAt, updatedAt
```

### User
```
id: UUID (PK)
organizationId: UUID (FK)
email: string (unique)
passwordHash: string (Argon2)
firstName, lastName: string
phone: string (encrypted)
roleId: UUID (FK)
apartmentId: UUID (FK, optional — sakin için)
createdAt, updatedAt
```

### Role & Permission
```
Role: id, name, organizationId
Permission: id, name, resource, action
RolePermission: roleId, permissionId
```

---

## 5. API Endpoints (Faz 1)

### Auth
- `POST /auth/register` — Organizasyon + admin kullanıcı oluşturma
- `POST /auth/login` — JWT token
- `POST /auth/refresh` — Refresh token

### Organizations
- `GET /organizations` — List (admin only)
- `GET /organizations/:id` — Detail

### Buildings
- `GET /buildings` — List (org'ya göre filtreli)
- `POST /buildings` — Create
- `PUT /buildings/:id` — Update
- `DELETE /buildings/:id` — Delete

### Apartments
- `GET /apartments` — List (building'e göre)
- `POST /apartments` — Create (batch import CSV)
- `PUT /apartments/:id` — Update
- `DELETE /apartments/:id` — Delete

### Users
- `GET /users` — List
- `POST /users` — Create
- `PUT /users/:id` — Update
- `DELETE /users/:id` — Soft delete

---

## 6. Standart API Response

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

## 7. Güvenlik

- [ ] Tüm API'ler JWT korumalı (public endpoints ayrı)
- [ ] RLS ile tenant isolation
- [ ] Argon2 ile şifre hashleme
- [ ] AES-256 ile TC No, telefon şifreleme
- [ ] Rate limiting (100 req/min)
- [ ] Audit logging (update/delete)

---

## 8. CI/CD Pipeline

```yaml
on: [push, pull_request]
steps:
  - Checkout
  - npm ci
  - npx tsc --noEmit
  - npm run lint
  - npm run test
  - Docker build & push (main branch)
  - Deploy to hostinger (docker compose)
```

---

## 9. Domain & Deployment

- **Domain:** vekil.tasci.cloud
- **SSL:** Let's Encrypt (Traefik)
- **Traefik:** Hostinger'da mevcut, label'lar docker-compose'da
- **Docker Network:** vekil_default (bridge)

---

*Son Güncelleme: 2026-05-10*