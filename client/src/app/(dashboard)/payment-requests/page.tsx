'use client';

import { useEffect, useState } from 'react';

interface PaymentRequest {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  paymentRef: string;
  paymentUrl: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  apartment: {
    id: string;
    unitNumber: string;
    building: { id: string; name: string };
  };
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  totalCollected: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  PROCESSING: 'İşleniyor',
  COMPLETED: 'Tamamlandı',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal Edildi',
  REFUNDED: 'İade Edildi',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    apartmentId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      let url = `http://localhost:3000/api/payment-requests?organizationId=${org.id}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/payment-requests/stats/summary?organizationId=${org.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch('http://localhost:3000/api/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: org.id,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ apartmentId: '', amount: '', description: '' });
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create payment request:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Bu ödeme talebini iptal etmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/payment-requests/${id}/cancel?organizationId=${org.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Ödemeler</h1>
          <p className="text-gray-500">Online ödeme talepleri ve takibi</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : '+ Ödeme Talebi Oluştur'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Toplam Talep</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-sm text-yellow-600">Bekleyen</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-600">Tamamlanan</p>
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600">Tahsil Edilen</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalCollected)}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tüm Durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="COMPLETED">Tamamlandı</option>
          <option value="FAILED">Başarısız</option>
          <option value="CANCELLED">İptal Edildi</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Yeni Ödeme Talebi</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daire ID</label>
                <input
                  type="text"
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Daire ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ödeme açıklaması"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Oluştur
            </button>
          </form>
        </div>
      )}

      {/* Payment Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz ödeme talebi yok
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ref No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Daire</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Açıklama</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Tutar</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Tarih</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {req.paymentRef}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {req.apartment.unitNumber}
                    <span className="text-gray-400 ml-1">({req.apartment.building.name})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {req.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(req.amount, req.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        İptal
                      </button>
                    )}
                    {req.status === 'COMPLETED' && req.paidAt && (
                      <span className="text-sm text-green-600">
                        {new Date(req.paidAt).toLocaleDateString('tr-TR')}
                      </span>
                    )}
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