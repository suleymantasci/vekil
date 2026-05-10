'use client';

import { useEffect, useState } from 'react';

interface Visitor {
  id: string;
  visitorName: string;
  visitorPhone: string | null;
  purpose: string;
  accessCode: string;
  qrCodeUrl: string | null;
  status: 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT' | 'EXPIRED';
  expectedArrival: string;
  validUntil: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  createdAt: string;
  building: { id: string; name: string };
  apartment: { id: string; unitNumber: string } | null;
}

interface Stats {
  total: number;
  checkedIn: number;
  checkedOut: number;
  expired: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CHECKED_IN: 'İçeri Girdi',
  CHECKED_OUT: 'Çıkış Yaptı',
  EXPIRED: 'Süresi Doldu',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CHECKED_IN: 'bg-green-100 text-green-700',
  CHECKED_OUT: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    buildingId: '',
    apartmentId: '',
    visitorName: '',
    visitorPhone: '',
    purpose: '',
    expectedArrival: '',
    validUntil: '',
  });

  useEffect(() => {
    fetchVisitors();
    fetchStats();
  }, [filterStatus]);

  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      let url = `http://localhost:3000/api/visitors?organizationId=${org.id}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setVisitors(data);
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/visitors/stats/summary?organizationId=${org.id}`, {
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
      
      const res = await fetch('http://localhost:3000/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: org.id,
          expectedArrival: new Date(formData.expectedArrival),
          validUntil: new Date(formData.validUntil),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          buildingId: '',
          apartmentId: '',
          visitorName: '',
          visitorPhone: '',
          purpose: '',
          expectedArrival: '',
          validUntil: '',
        });
        fetchVisitors();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create visitor:', error);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/visitors/${id}/check-out?organizationId=${org.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchVisitors();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to check out:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Bu ziyaretçi davetini iptal etmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/visitors/${id}/cancel?organizationId=${org.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchVisitors();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ziyaretçi Yönetimi</h1>
          <p className="text-gray-500">Ziyaretçi daveti ve erişim takibi</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : '+ Davet Oluştur'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Toplam Davet</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-600">İçeri Girdi</p>
            <p className="text-2xl font-bold text-green-700">{stats.checkedIn}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600">Çıkış Yaptı</p>
            <p className="text-2xl font-bold text-blue-700">{stats.checkedOut}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Süresi Doldu</p>
            <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
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
          <option value="CHECKED_IN">İçeri Girdi</option>
          <option value="CHECKED_OUT">Çıkış Yaptı</option>
          <option value="EXPIRED">Süresi Doldu</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Yeni Ziyaretçi Daveti</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bina ID</label>
                <input
                  type="text"
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daire ID (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ziyaretçi Adı</label>
                <input
                  type="text"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (Opsiyonel)</label>
                <input
                  type="tel"
                  value={formData.visitorPhone}
                  onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amaç</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ziyaret amacı"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Varış</label>
                <input
                  type="datetime-local"
                  value={formData.expectedArrival}
                  onChange={(e) => setFormData({ ...formData, expectedArrival: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Süresi</label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Davet Oluştur
            </button>
          </form>
        </div>
      )}

      {/* Visitors List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz ziyaretçi daveti yok
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ziyaretçi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Bina / Daire</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Erişim Kodu</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amaç</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Geçerlilik</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{visitor.visitorName}</p>
                      {visitor.visitorPhone && (
                        <p className="text-sm text-gray-500">{visitor.visitorPhone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {visitor.building.name}
                    {visitor.apartment && <span className="text-gray-400"> / {visitor.apartment.unitNumber}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{visitor.accessCode}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[visitor.status]}`}>
                      {STATUS_LABELS[visitor.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{visitor.purpose}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(visitor.validUntil).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    {visitor.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleCheckOut(visitor.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Çıkış
                      </button>
                    )}
                    {visitor.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(visitor.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        İptal
                      </button>
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