'use client';

import { useEffect, useState } from 'react';

interface PurchaseRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  estimatedAmount?: number;
  awardedAmount?: number;
  deadline?: string;
  building: { id: string; name: string };
  supplier?: { id: string; name: string };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  AWARDED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: ' Yayınlandı',
  RECEIVED: 'Teklif Alındı',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  AWARDED: 'İhale Kesildi',
  CANCELLED: 'İptal',
};

const categoryLabels: Record<string, string> = {
  construction: '🏗️ İnşaat',
  cleaning: '🧹 Temizlik',
  security: '🔒 Güvenlik',
  maintenance: '🔧 Bakım',
  other: '📋 Diğer',
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/purchases?organizationId=${org.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setPurchases(data.data || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPurchases(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satın Alma Talepleri</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {purchases.length} talep</p>
        </div>
        <button onClick={loadPurchases} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
          Yenile
        </button>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = purchases.filter(p => p.status === key).length;
          if (count === 0) return null;
          return (
            <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">🛒</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz talep yok</h3>
          <p className="mt-2 text-gray-500">İhale ve satın alma talepleriniz burada görünecek.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talep</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{p.title}</div>
                    <div className="text-sm text-gray-500">{p.description.slice(0, 60)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <span>{categoryLabels[p.category] || p.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    {p.awardedAmount ? (
                      <span className="font-semibold text-green-700">{p.awardedAmount.toFixed(2)} ₺</span>
                    ) : p.estimatedAmount ? (
                      <span className="text-gray-700">{p.estimatedAmount.toFixed(2)} ₺</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
