'use client';

import { useEffect, useState } from 'react';

interface Charge {
  id: string;
  apartmentId: string;
  period: string;
  description: string;
  chargeType: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  apartment: {
    number: string;
    building: { name: string };
  };
  user?: { firstName: string; lastName: string };
  lateFees: Array<{ amount: number; isPaid: boolean }>;
  payments?: Array<{ amount: number }>;
}

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<any>(null);

  const loadCharges = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/tahakkuk/charges?organizationId=${org.id}&period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setCharges(data.data || []);
        
        // Calculate summary
        const chargesData = data.data || [];
        const total = chargesData.reduce((s: number, c: Charge) => s + c.amount, 0);
        const paid = chargesData.reduce((s: number, c: Charge) => s + (c.payments?.reduce((ps: number, p: any) => ps + p.amount, 0) || 0), 0);
        setSummary({
          total: chargesData.length,
          totalAmount: total,
          totalPaid: paid,
          totalUnpaid: total - paid,
        });
      }
    } catch (err) {
      console.error('Load charges error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharges();
  }, [period]);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };

  const chargeTypeLabels: Record<string, string> = {
    MONTHLY_FEE: 'Aylık Aidat',
    CONSUMPTION: 'Tüketim',
    DUES: 'Diğer Aidatlar',
    PENALTY: 'Ceza',
    OTHER: 'Diğer',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tahakkuk (Borçlar)</h1>
          <p className="text-gray-500 text-sm mt-1">
            Dönem: {period}
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            onClick={loadCharges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Toplam Tahakkuk</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Toplam Borç</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.totalAmount.toLocaleString('tr-TR')} ₺
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Tahsil Edilen</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {summary.totalPaid.toLocaleString('tr-TR')} ₺
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Kalan Borç</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {summary.totalUnpaid.toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : charges.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">📋</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Bu dönemde tahakkuk bulunamadı</h3>
          <p className="mt-2 text-gray-500">Önce aidat kuralları oluşturup tahakkuk oluşturmanız gerekiyor.</p>
          <a
            href="/settings/tahakkuk-rules"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Aidat Kuralları
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ödenen</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kalan</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {charges.map((charge) => {
                const paid = charge.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                const remaining = charge.amount - paid;
                return (
                  <tr key={charge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{charge.apartment.number}</div>
                      <div className="text-sm text-gray-500">{charge.apartment.building.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{charge.description}</div>
                      <div className="text-sm text-gray-500">Vade: {new Date(charge.dueDate).toLocaleDateString('tr-TR')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {chargeTypeLabels[charge.chargeType] || charge.chargeType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {charge.amount.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      {paid.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[charge.status]}`}>
                        {charge.status === 'PENDING' ? 'Ödenmedi' :
                         charge.status === 'PARTIAL' ? 'Kısmi' :
                         charge.status === 'PAID' ? 'Ödendi' : 'İptal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}