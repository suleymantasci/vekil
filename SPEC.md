# Vekil — Otonom Apartman ve Site Yönetimi SaaS

**Proje:** Vekil  
**Domain:** vekil.tasci.cloud  
**GitHub:** github.com/suleymantasci/vekil  
**Durum:** Faz 4 Tamamlandı — Faz 5'e Geçiliyor

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
- [x] Unit tests (24 → 46 passing)

### ✅ Faz 3 — AI Chatbot + Teknik Servis (2026-05-10)
- [x] WorkOrders module (CRUD, status, priority, assignment)
- [x] Assets module (CRUD, warranty tracking)
- [x] WhatsApp chatbot service (intent classification, auto responses)
- [x] WhatsApp webhook (Meta verification, incoming messages)
- [x] KVKK consent management for WhatsApp
- [x] Client UI: Work Orders + Assets pages
- [x] Phase 3 permissions (workorders, assets, whatsapp)
- [x] Unit tests (70 → 100+ passing)

### ✅ Faz 4 — Operasyon ve Sakin Deneyimi (2026-05-10)
- [x] Rezervasyon sistemi (tesis, kort, otopark, gym, meeting_room)
- [x] Conflict detection (double booking prevention)
- [x] Hourly slot availability (09:00-22:00)
- [x] İhale ve satın alma modulü (Supplier, PurchaseRequest)
- [x] Toplantı ve katılım takibi (MeetingAttendance)
- [x] Dijital oylama sistemi (Vote, VoteParticipant)
- [x] Client UI: Reservations, Meetings, Purchases pages
- [x] 98 unit tests passing

### ⏳ Faz 5 — GEO/SEO ve Rakip Analizi
- [ ] PostGIS geo-fencing (personel konum doğrulama)
- [ ] Next.js SSR + JSON-LD structured data
- [ ] RAKİP ANALİZİ → eksik modüllerin tespiti
- [ ] SEO optimizasyonu

---

## Son Commit
- `41e0e5a` - feat(vekil): Phase 4 complete

## Commit History
- `42c35ff` - Phase 1 foundation
- `8158d91` - Phase 2 finance engine (backend)
- `6b3a86a` - Phase 2 finance UI pages
- `ec337e3` - Phase 2 unit tests (24 passing)
- `73932e1` - Phase 3 backend (Work Orders, Assets, WhatsApp)
- `c007cf6` - Phase 3 UI pages
- `85efd3c` - Phase 3 tests + WhatsApp keyword fixes (70 tests)
- `4c1029c` - Phase 4 backend modules
- `41e0e5a` - Phase 4 UI + tests (98 passing)

## WhatsApp Chatbot Komutları
- `/borcum` - Borç durumu sorgulama
- `/odemelerim` - Son ödemeler
- `/bildirim` - Arıza bildirimi
- `/yardim` - Yardım

## Test Coverage
| Service | Tests |
|---------|-------|
| LateFeeService | 7 |
| TahakkukService | 10 |
| PaymentsService | 8 |
| WorkOrdersService | 20 |
| AssetsService | 11 |
| WhatsAppService | 14 |
| ReservationsService | 10 |
| VotesService | 9 |
| MeetingsService | 5 |
| PurchasesService | 9 |
| **Total** | **98** |

## Deployment
- Traefik ile vekil.tasci.cloud
- Docker Compose