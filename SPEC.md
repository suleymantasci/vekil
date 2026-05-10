# Vekil — Otonom Apartman ve Site Yönetimi SaaS

**Proje:** Vekil  
**Domain:** vekil.tasci.cloud  
**GitHub:** github.com/suleymantasci/vekil  
**Durum:** Faz 1 Tamamlandı → Faz 2 Başlanabilir

---

## Faz Durumu

### ✅ Faz 1 — Çekirdek Altyapı (2026-05-10)
- [x] Multi-tenant PostgreSQL + Row-Level Security (RLS)
- [x] NestJS proje yapısı + Prisma şeması
- [x] JWT Auth (login, register, refresh token)
- [x] Organization/Building/Apartment modelleri
- [x] User + Role + Permission sistemi (SUPER_ADMIN, ORGANIZATION_ADMIN, BUILDING_MANAGER, RESIDENT, SECURITY, TECHNICIAN)
- [x] CI/CD pipeline (GitHub Actions → hostinger)
- [x] Audit logging for all mutations
- [x] KVKK aydınlatma metni sayfası
- [x] Client auth pages (login/register/dashboard)
- [x] Buildings CRUD yönetimi

### ⏳ Faz 2 — Finans Motoru + WhatsApp
- [ ] Tahakkuk (aidat borçlandırma) motoru
- [ ] KMK 20. madde gecikme faizi (%5/ay, günlük işletim)
- [ ] WhatsApp Business API entegrasyonu
- [ ] KVKK opt-in onay mekanizması
- [ ] Borç/sorgu endpoint'leri (WhatsApp chatbot)

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
- `42c35ff` - feat(vekil): Complete Phase 1 foundation

## Veritabanı
- RLS migration: `server/prisma/migrations/001_enable_rls.sql`
- Seed script: `server/prisma/seed.ts`

## Deployment
- Traefik ile vekil.tasci.cloud üzerinde çalışıyor
- Docker Compose ile yönetiliyor