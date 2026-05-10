# Vekil — Otonom Apartman ve Site Yönetimi SaaS

**Proje:** Vekil  
**Domain:** vekil.tasci.cloud  
**GitHub:** github.com/suleymantasci/vekil  
**Durum:** Faz 2 Geliştirme Aşamasında

---

## Faz Durumu

### ✅ Faz 1 — Çekirdek Altyapı (2026-05-10)
- [x] Multi-tenant PostgreSQL + Row-Level Security (RLS)
- [x] NestJS proje yapısı + Prisma şeması
- [x] JWT Auth (login, register, refresh token)
- [x] Organization/Building/Apartment modelleri
- [x] User + Role + Permission sistemi (6 rol, 45+ permission)
- [x] CI/CD pipeline (GitHub Actions → hostinger)
- [x] Audit logging for all mutations
- [x] KVKK aydınlatma metni sayfası
- [x] Client auth pages (login/register/dashboard)
- [x] Buildings CRUD yönetimi

### ✅ Faz 2 — Finans Motoru + WhatsApp (2026-05-10)
- [x] TahakkukRule model + service
- [x] Charge model (aidat borçlandırma)
- [x] LateFee model + KMK Madde 20 hesaplama (%5/ay)
- [x] Payment model + service
- [x] Invoice model
- [x] Tahakkuk generateCharges() — dönem bazlı borçlandırma
- [x] Daire borç durumu sorgulama
- [x] 40+ finance permission eklendi
- [x] **Client UI**: Tahakkuk Rules sayfası
- [x] **Client UI**: Charges (Borçlar) sayfası
- [x] **Client UI**: Payments (Ödemeler) sayfası
- [x] **Client UI**: Dashboard finance summary cards
- [x] **API Client**: tahakkukApi + paymentsApi

### ⏳ Faz 2 Kalan İşler
- [ ] WhatsApp Business API entegrasyonu (API key bekleniyor)
- [ ] KVKK opt-in onay mekanizması (WhatsApp chatbot için)
- [ ] Borç/sorgu endpoint'leri (WhatsApp üzerinden borç sorgulama)

### ⏳ Faz 3 — AI Chatbot + Teknik Servis
- [ ] RAG tabanlı WhatsApp chatbot (OpenAI/Gemini)
- [ ] Arıza bildirimi → iş emri dönüşümü
- [ ] Demirbaş (asset) yönetimi
- [ ] QR kodlu teknik servisi kontrolü

### ⏳ Faz 4 — Operasyon ve Sakin Deneyimi
- [ ] Rezervasyon sistemi (tesis, kort, otopark)
- [ ] İhale ve satın alma modulü
- [ ] Ziyaretçi yönetimi (QR kodlu davetiye)
- [ ] Dijital genel kurul ve oylama

### ⏳ Faz 5 — GEO/SEO ve Rakip Analizi
- [ ] PostGIS geo-fencing (personel konum doğrulama)
- [ ] Next.js SSR + JSON-LD structured data
- [ ] RAKIP ANALİZİ → eksik modüllerin tespiti
- [ ] Ek modüllerin eklenmesi

---

## Son Commit
- `6b3a86a` - feat(vekil): Phase 2 - Finance UI pages

## Commit History
- `42c35ff` - feat(vekil): Complete Phase 1 foundation
- `8158d91` - feat(vekil): Phase 2 - Finance Engine (backend)
- `6b3a86a` - feat(vekil): Phase 2 - Finance UI pages (frontend)

## Client Routes
- `/login` — Giriş
- `/register` — Kayıt
- `/kvkk` — KVKK Aydınlatma Metni
- `/dashboard` — Ana panel (finans özeti + hızlı işlemler)
- `/buildings` — Bina CRUD
- `/charges` — Tahakkuk (borçlar) listesi
- `/payments` — Ödemeler listesi + kaydet
- `/settings/tahakkuk-rules` — Aidat kuralları yönetimi

## API Endpoints (Phase 2)
- `POST /tahakkuk/rules` — Kural oluştur
- `GET /tahakkuk/rules` — Kuralları listele
- `POST /tahakkuk/generate` — Tahakkuk oluştur
- `GET /tahakkuk/charges` — Borçları listele
- `GET /tahakkuk/apartment/:id/balance` — Daire borç durumu
- `POST /tahakkuk/calculate-late-fees` — Gecikme faizi hesapla
- `POST /payments` — Ödeme kaydet
- `GET /payments` — Ödemeleri listele

## Deployment
- Traefik ile vekil.tasci.cloud üzerinde çalışıyor
- Docker Compose ile yönetiliyor