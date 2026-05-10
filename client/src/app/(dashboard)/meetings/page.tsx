'use client';

import { useEffect, useState } from 'react';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingDate: string;
  location?: string;
  status: string;
  building: { id: string; name: string };
  _count: { votes: number; attendances: number };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/meetings?organizationId=${org.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setMeetings(data.data || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMeetings(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toplantılar</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {meetings.length} toplantı</p>
        </div>
        <button onClick={loadMeetings} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">🏛️</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz toplantı yok</h3>
          <p className="mt-2 text-gray-500">Genel kurul ve toplantılarınız burada görünecek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map(m => (
            <div key={m.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{m.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.building.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}>
                  {m.status === 'DRAFT' ? 'Taslak' :
                   m.status === 'SCHEDULED' ? 'Planlanan' :
                   m.status === 'IN_PROGRESS' ? 'Devam Eden' :
                   m.status === 'COMPLETED' ? 'Tamamlandı' :
                   m.status === 'CANCELLED' ? 'İptal' : m.status}
                </span>
              </div>
              {m.description && <p className="mt-3 text-sm text-gray-600">{m.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>📅 {new Date(m.meetingDate).toLocaleDateString('tr-TR')}</span>
                {m.location && <span>📍 {m.location}</span>}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                <span className="text-sm text-gray-500">🗳️ {m._count.votes} oylama</span>
                <span className="text-sm text-gray-500">👥 {m._count.attendances} katılımcı</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
