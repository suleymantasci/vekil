import { redirect } from 'next/navigation';
import { authApi } from '@/lib/api';

export default async function HomePage() {
  // Server-side check - try to read token from cookie or just show landing
  // Client will handle auth redirect
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="px-6 py-20 mx-auto max-w-6xl">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            🚀 Faz 1 — Çekirdek Altyapı Tamamlandı
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            Vekil
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Otonom apartman ve site yönetimi için AI destekli SaaS platformu.
            WhatsApp ile sorgulama, otomatik aidat, teknik servis ve daha fazlası.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <a href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
              Giriş Yap
            </a>
            <a href="/register" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              Kayıt Ol
            </a>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-16 mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Faz 1 — Çekirdek Modüller ✓
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '🏢', title: 'Çoklu Kiracı (Multi-Tenant)', desc: 'PostgreSQL RLS ile %100 veri izolasyonu' },
            { icon: '🔐', title: 'JWT Auth', desc: 'Güvenli kimlik doğrulama ve yetkilendirme' },
            { icon: '📊', title: 'Bina & Daire Yönetimi', desc: 'Arsa payı, m² ve sabit bazlı yapı' },
            { icon: '👥', title: 'Kullanıcı & Rol Sistemi', desc: '6 farklı rol, detaylı izin yönetimi' },
            { icon: '📝', title: 'Audit Logging', desc: 'Tüm değişiklikler IP ve kullanıcı ile loglanır' },
            { icon: '🔄', title: 'CI/CD Pipeline', desc: 'GitHub Actions → Hostinger deploy' },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Phase Progress */}
      <section className="px-6 py-16 mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Geliştirme Yol Haritası
        </h2>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { phase: 'Faz 1', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'Çekirdek Altyapı' },
            { phase: 'Faz 2', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'Finans Motoru + WhatsApp' },
            { phase: 'Faz 3', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'AI Chatbot + Teknik Servis' },
            { phase: 'Faz 4', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'Operasyon ve Sakin Deneyimi' },
            { phase: 'Faz 5', status: 'Sırada', color: 'bg-blue-100 text-blue-700', desc: 'GEO/SEO Optimizasyonu' },
          ].map((p, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${p.color}`}>
                {p.status}
              </div>
              <h3 className="font-bold text-gray-900">{p.phase}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-6 py-16 mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Teknoloji Yığını
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {['NestJS', 'Prisma', 'PostgreSQL', 'Next.js 15', 'Tailwind CSS', 'shadcn/ui', 'Redis/BullMQ', 'WhatsApp API', 'OpenAI'].map((tech) => (
            <span key={tech} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Vekil © 2026 — Sıfır Yönetimsel Hata Mottosuyla</p>
      </footer>
    </main>
  );
}