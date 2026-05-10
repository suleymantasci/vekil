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
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            ✅ Faz 1-5 Tamamlandı — Tüm Çekirdek Modüller Hazır
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
          Tamamlanan Modüller
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: '🏢', title: 'Çekirdek', desc: 'Multi-tenant, JWT, RLS, Audit', phase: 'Faz 1' },
            { icon: '💰', title: 'Finans', desc: 'Aidat, Gecikme Faizi, Ödemeler', phase: 'Faz 2' },
            { icon: '🤖', title: 'AI Chatbot', desc: 'WhatsApp, WorkOrders, Assets', phase: 'Faz 3' },
            { icon: '📅', title: 'Operasyon', desc: 'Rezervasyon, Toplantı, Oylama', phase: 'Faz 4' },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{f.phase}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Extra Features - Phase 5 */}
      <section className="px-6 py-16 mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Faz 5 — Ek Özellikler
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: '🔔', title: 'Bildirimler', desc: 'Anlık bildirimler ve duyurular' },
            { icon: '📁', title: 'Döküman', desc: 'Fatura, sözleşme, makbuz yönetimi' },
            { icon: '💹', title: 'Muhasebe', desc: 'Gelir-gider takibi ve raporlama' },
            { icon: '💳', title: 'Online Ödeme', desc: 'Online ödeme talep ve takibi' },
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
            { phase: 'Faz 2', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'Finans Motoru' },
            { phase: 'Faz 3', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'AI Chatbot + Servis' },
            { phase: 'Faz 4', status: 'Tamamlandı ✓', color: 'bg-green-100 text-green-700', desc: 'Operasyon' },
            { phase: 'Faz 5', status: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700', desc: 'SEO + Rakip Analizi' },
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
          {['NestJS', 'Prisma', 'PostgreSQL', 'Next.js 15', 'Tailwind CSS', 'TypeScript', 'WhatsApp API', 'JWT', 'RLS'].map((tech) => (
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