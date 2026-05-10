'use client';

import { useEffect, useState } from 'react';
import { buildingsApi } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    buildings: 0,
    apartments: 0,
    users: 0,
    openWorkOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Load dashboard data
    const loadData = async () => {
      try {
        const { data } = await buildingsApi.list(1, 10);
        if (data.success) {
          setStats((prev) => ({ ...prev, buildings: data.meta?.total || 0 }));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    };
    loadData();
  }, []);

  const statCards = [
    { label: 'Binalar', value: stats.buildings, icon: '🏢', color: 'bg-blue-500' },
    { label: 'Daireler', value: stats.apartments, icon: '🏠', color: 'bg-green-500' },
    { label: 'Kullanıcılar', value: stats.users, icon: '👥', color: 'bg-purple-500' },
    { label: 'Açık İş Emirleri', value: stats.openWorkOrders, icon: '🔧', color: 'bg-orange-500' },
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="space-y-3">
            <a
              href="/buildings"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">🏢</span>
              <span className="font-medium text-gray-700">Yeni Bina Ekle</span>
            </a>
            <a
              href="/users"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">👤</span>
              <span className="font-medium text-gray-700">Yeni Kullanıcı Ekle</span>
            </a>
            <a
              href="/roles"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-xl">🔐</span>
              <span className="font-medium text-gray-700">Rolleri Yönet</span>
            </a>
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
          </div>
        </div>
      </div>
    </div>
  );
}