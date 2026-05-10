# Vekil — Otonom Apartman ve Site Yönetimi SaaS

**Proje:** Vekil  
**Domain:** vekil.tasci.cloud  
**GitHub:** github.com/suleymantasci/vekil  
**Durum:** Faz 3 Tamamlandı

---

## Faz Durumu

### ✅ Faz 1 — Çekirdek Altyapı (2026-05-10)
- [x] Multi-tenant PostgreSQL + Row-Level Security (RLS)
- [x] NestJS proje yapısı + Prisma şeması
- [x] JWT Auth (login, register, refresh token)
- [x] Organization/Building/Apartment modelleri
- [x] User + Role + Permission sistemi (6 rol, 50+ permission)
- [x] CI/CD pipeline (GitHub Actions → hostinger)
- [x] Audit logging for all mutations
- [x] KVKK aydınlatma metni sayfası
- [x] Client auth pages (login/register/dashboard)
- [x] Buildings CRUD yönetimi

### ✅ Faz 2 — Finans Motoru (2026-05-10)
- [x] TahakkukRule, Charge, LateFee, Payment, Invoice modelleri
- [x] KMK Madde 20 gecikme faizi (%5/ay, günlük işletim)
- [x] Dönem bazlı borçlandırma (fixed, area_m2, share_ratio)
- [x] Ödeme + otomatik dağıtım
- [x] Client UI: Tahakkuk Rules, Charges, Payments pages
- [x] 40+ finance permissions
- [x] Unit tests (24 passing)

### ✅ Faz 3 — AI Chatbot + Teknik Servis (2026-05-10)
- [x] WorkOrders module (CRUD, status, priority, assignment)
- [x] Assets module (CRUD, warranty tracking)
- [x] WhatsApp chatbot service (intent classification, auto responses)
- [x] WhatsApp webhook (Meta verification, incoming messages)
- [x] KVKK consent management for WhatsApp
- [x] Client UI: Work Orders + Assets pages
- [x] Phase 3 permissions (workorders, assets, whatsapp)

### ⏳ Faz 4 — Operasyon ve Sakin Deneyimi
- [ ] Rezervasyon sistemi (tesis, kort, otopark)
- [ ] İhale ve satın alma modulü
- [ ] Ziyaretçi yönetimi (QR kodlu davetiye)
- [ ] Dijital genel kurul ve oylama

### ⏳ Faz 5 — GEO/SEO ve Rakip Analizi
- [ ] PostGIS geo-fencing (personel konum doğrulama)
- [ ] Next.js SSR + JSON-LD structured data
- [ ] RAKIP ANALİZİ → eksik modüllerin tespiti

---

## Son Commit
- `c007cf6` - feat(vekil): Phase 3 UI pages

## Commit History
- `42c35ff` - Phase 1 foundation
- `8158d91` - Phase 2 finance engine (backend)
- `6b3a86a` - Phase 2 finance UI pages
- `ec337e3` - Phase 2 unit tests (24 passing)
- `73932e1` - Phase 3 backend (Work Orders, Assets, WhatsApp)
- `c007cf6` - Phase 3 UI pages

## WhatsApp Chatbot Komutları
- `/borcum` - Borç durumu sorgulama
- `/odemelerim` - Son ödemeler
- `/bildirim` - Arıza bildirimi
- `/yardim` - Yardım

## API Endpoints (Phase 3)
- `POST /work-orders` - İş emri oluştur
- `GET /work-orders` - İş emirleri listesi
- `PUT /work-orders/:id/assign` - Atama
- `GET /assets` - Demirbaşlar
- `GET /assets/:id/warranty` - Garanti durumu
- `POST /whatsapp/webhook` - WhatsApp mesajları
- `POST /whatsapp/opt-in` - KVKK onayı

## Deployment
- Traefik ile vekil.tasci.cloud
- Docker Compose