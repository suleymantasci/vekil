'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'EVENT';
  isPublished: boolean;
  publishedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  building: { id: string; name: string } | null;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'INFO' as const,
    buildingId: '',
    isPublished: false,
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('vekil_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/announcements?organizationId=${org.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch('http://localhost:3000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: org.id,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ title: '', body: '', type: 'INFO', buildingId: '', isPublished: false });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/announcements/${id}/publish?organizationId=${org.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to publish announcement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/announcements/${id}?organizationId=${org.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      INFO: 'bg-blue-100 text-blue-700',
      WARNING: 'bg-yellow-100 text-yellow-700',
      URGENT: 'bg-red-100 text-red-700',
      EVENT: 'bg-green-100 text-green-700',
    };
    return styles[type as keyof typeof styles] || styles.INFO;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="text-gray-500">Bina ve site duyurularını yönet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : '+ Yeni Duyuru'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Yeni Duyuru Oluştur</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="INFO">Bilgi</option>
                  <option value="WARNING">Uyarı</option>
                  <option value="URGENT">Acil</option>
                  <option value="EVENT">Etkinlik</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bina</label>
                <input
                  type="text"
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  placeholder="Bina ID (opsiyonel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hemen Yayınla</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Duyuru Oluştur
            </button>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz duyuru yok
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(announcement.type)}`}>
                      {announcement.type === 'INFO' && 'Bilgi'}
                      {announcement.type === 'WARNING' && 'Uyarı'}
                      {announcement.type === 'URGENT' && 'Acil'}
                      {announcement.type === 'EVENT' && 'Etkinlik'}
                    </span>
                    {announcement.isPublished ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Yayında
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Taslak
                      </span>
                    )}
                    {announcement.building && (
                      <span className="text-sm text-gray-500">{announcement.building.name}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                  <p className="text-gray-600 mt-2">{announcement.body}</p>
                  <p className="text-sm text-gray-400 mt-3">
                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!announcement.isPublished && (
                    <button
                      onClick={() => handlePublish(announcement.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Yayınla
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}