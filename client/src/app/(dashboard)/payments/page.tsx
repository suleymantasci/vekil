'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  paidAt: string;
  apartment: {
    number: string;
    building: { name: string };
  };
  charge?: { description: string; period: string };
  user?: { firstName: string; lastName: string };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    apartmentId: '',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    chargeId: '',
    reference: '',
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments?organizationId=${org.id}&period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setPayments(data.data?.data || []);
        setSummary({
          total: data.data?.meta?.total || 0,
          totalAmount: (data.data?.data || []).reduce((s: number, p: Payment) => s + p.amount, 0),
        });
      }
    } catch (err) {
      console.error('Load payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            organizationId: org.id,
            apartmentId: formData.apartmentId,
            amount: parseFloat(formData.amount),
            paymentMethod: formData.paymentMethod,
            chargeId: formData.chargeId || undefined,
            reference: formData.reference || undefined,
          }),
        }
      );
      
      setShowModal(false);
      setFormData({ apartmentId: '', amount: '', paymentMethod: 'BANK_TRANSFER', chargeId: '', reference: '' });
      loadPayments();
    } catch (err) {
      console.error('Create payment error:', err);
    }
  };

  const paymentMethodLabels: Record<string, string> = {
    CASH: '💵 Nakit',
    BANK_TRANSFER: '🏦 Banka Transferi',
    CREDIT_CARD: '💳 Kredi Kartı',
    DIGITAL_WALLET: '📱 Dijital Cüzdan',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ödemeler</h1>
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
            onClick={loadPayments}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Yenile
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Ödeme Ekle
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Toplam Ödeme</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total} işlem</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Tahsil Edilen</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {summary.totalAmount.toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">💳</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Bu dönemde ödeme bulunamadı</h3>
          <p className="mt-2 text-gray-500">Tahakkuk oluşturduktan sonra ödemeleri buradan kaydedebilirsiniz.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yöntem</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payment.paidAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{payment.apartment.number}</div>
                    <div className="text-sm text-gray-500">{payment.apartment.building.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{payment.charge?.description || 'Genel Ödeme'}</div>
                    {payment.charge?.period && (
                      <div className="text-sm text-gray-500">{payment.charge.period}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                    {payment.amount.toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Yeni Ödeme</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daire Numarası *</label>
                <input
                  type="text"
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="101"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="BANK_TRANSFER">Banka Transferi</option>
                  <option value="CASH">Nakit</option>
                  <option value="CREDIT_CARD">Kredi Kartı</option>
                  <option value="DIGITAL_WALLET">Dijital Cüzdan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referans / Açıklama</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ödeme açıklaması..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}