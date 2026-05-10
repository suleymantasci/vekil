'use client';

import { useEffect, useState } from 'react';

interface Reservation {
  id: string;
  facility: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  building: { id: string; name: string };
  apartment: { id: string; unitNumber: string };
}

const facilityLabels: Record<string, string> = {
  pool: '🏊 Havuz',
  court: '🎾 Tenis Kortu',
  parking: '🚗 Otopark',
  meeting_room: '🏛️ Toplantı Odası',
  gym: '🏋️ Spor Salonu',
  other: '📋 Diğer',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ facility: '', status: '' });

  const loadReservations = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      const params = new URLSearchParams({ organizationId: org.id });
      if (filter.facility) params.append('facility', filter.facility);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reservations?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setReservations(data.data || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReservations(); }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {reservations.length} rezervasyon</p>
        </div>
        <button
          onClick={loadReservations}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Yenile
        </button>
      </div>

      {/* Facility stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(facilityLabels).map(([key, label]) => {
          const count = reservations.filter(r => r.facility === key).length;
          return (
            <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-2xl mb-1">{label.split(' ')[0]}</p>
              <p className="text-sm text-gray-500 font-medium">{label.split(' ')[1] || label}</p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">📅</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz rezervasyon yok</h3>
          <p className="mt-2 text-gray-500">Tesis rezervasyonu yapılmadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tesis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih / Saat</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{facilityLabels[r.facility] || r.facility}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <div className="text-sm text-gray-500">{r.building.name} — Daire {r.apartment.unitNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(r.startTime).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                      {r.status === 'PENDING' ? 'Bekleyen' :
                       r.status === 'APPROVED' ? 'Onaylı' :
                       r.status === 'REJECTED' ? 'Reddedildi' :
                       r.status === 'CANCELLED' ? 'İptal' : r.status}
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
