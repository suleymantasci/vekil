'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
}

interface Org {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [stats, setStats] = useState({
    buildings: 0,
    apartments: 0,
    users: 0,
    openWorkOrders: 0,
  });
  const [finance, setFinance] = useState({
    thisMonth: { total: 0, paid: 0, unpaid: 0 },
    lateFees: 0,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('vekil_user');
    const storedOrg = localStorage.getItem('vekil_org');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedOrg) setOrg(JSON.parse(storedOrg));

    // Load finance summary
    loadFinanceSummary();
  }, []);

  const loadFinanceSummary = async () => {
    try {
      const orgData = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      if (!orgData.id || !token) return;

      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Load charges summary
      const chargesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tahakkuk/charges?organizationId=${orgData.id}&period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chargesData = await chargesRes.json();
      
      if (chargesData.success && chargesData.data) {
        const charges = chargesData.data;
        const total = charges.reduce((s: number, c: any) => s + c.amount, 0);
        const paid = charges.reduce((s: number, c: any) => {
          return s + (c.payments?.reduce((ps: number, p: any) => ps + p.amount, 0) || 0);
        }, 0);
        
        setFinance((prev) => ({
          ...prev,
          thisMonth: { total, paid, unpaid: total - paid },
        }));
      }
    } catch (err) {
      console.error('Load finance summary error:', err);
    }
  };

  const statCards = [
    { label: 'Binalar', value: stats.buildings, icon: '🏢', color: 'bg-blue-500', href: '/buildings' },
    { label: 'Daireler', value: stats.apartments, icon: '🏠', color: 'bg-green-500', href: '#' },
    { label: 'Kullanıcılar', value: stats.users, icon: '👥', color: 'bg-purple-500', href: '/users' },
    { label: 'Açık İş Emirleri', value: stats.openWorkOrders, icon: '🔧', color: 'bg-orange-500', href: '#' },
  ];

  const financeCards = [
    { label: 'Bu Ay Tahakkuk', value: finance.thisMonth.total, icon: '💰', color: 'bg-blue-500' },
    { label: 'Tahsil Edilen', value: finance.thisMonth.paid, icon: '✅', color: 'bg-green-500' },
    { label: 'Kalan Borç', value: finance.thisMonth.unpaid, icon: '⚠️', color: 'bg-red-500' },
    { label: 'Gecikme Faizi', value: finance.lateFees, icon: '📈', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Hoş Geldiniz!</h2>
        <p className="text-blue-100">
          Vekil apartman ve site yönetimi sistemine hoş geldiniz. Sol menüden bina, daire ve kullanıcı yönetimine erişebilirsiniz.
        </p>
      </div>

      {/* Finance Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Finans Özeti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financeCards.map((card, i) => (
            <Link
              key={i}
              href={card.label.includes('Tahakkuk') ? '/charges' : card.label.includes('Ödeme') ? '/payments' : '#'}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Genel Bakış</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition ${stat.href === '#' ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="space-y-3">
            <Link
              href="/settings/tahakkuk-rules"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">📋</span>
              <span className="font-medium text-gray-700">Aidat Kuralları</span>
            </Link>
            <Link
              href="/buildings"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">🏢</span>
              <span className="font-medium text-gray-700">Yeni Bina Ekle</span>
            </Link>
            <Link
              href="/charges"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">💰</span>
              <span className="font-medium text-gray-700">Tahakkuk Oluştur</span>
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">💳</span>
              <span className="font-medium text-gray-700">Ödeme Kaydet</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Sistem Durumu</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-green-500">●</span>
                <span className="font-medium text-gray-700">Veritabanı Bağlantısı</span>
              </div>
              <span className="text-sm text-green-600">Aktif</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-green-500">●</span>
                <span className="font-medium text-gray-700">API Servisi</span>
              </div>
              <span className="text-sm text-green-600">Aktif</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-green-500">●</span>
                <span className="font-medium text-gray-700">Çoklu Kiracı (RLS)</span>
              </div>
              <span className="text-sm text-green-600">Aktif</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-green-500">●</span>
                <span className="font-medium text-gray-700">Finans Motoru (KMK 20)</span>
              </div>
              <span className="text-sm text-green-600">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}