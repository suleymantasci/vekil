'use client';

import { useEffect, useState } from 'react';
import { buildingsApi } from '@/lib/api';
import type { Building } from '@/types';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    totalFloors: 1,
    totalApartments: 1,
    managerName: '',
    managerPhone: '',
    managerEmail: '',
  });

  const loadBuildings = async () => {
    setLoading(true);
    try {
      const { data } = await buildingsApi.list(1, 50);
      if (data.success) {
        setBuildings(data.data);
      }
    } catch (err) {
      console.error('Load buildings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await buildingsApi.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        district: '',
        totalFloors: 1,
        totalApartments: 1,
        managerName: '',
        managerPhone: '',
        managerEmail: '',
      });
      loadBuildings();
    } catch (err) {
      console.error('Create building error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu binayı silmek istediğinizden emin misiniz?')) return;
    try {
      await buildingsApi.delete(id);
      loadBuildings();
    } catch (err) {
      console.error('Delete building error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Binalar</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {buildings.length} bina</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Yeni Bina
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : buildings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">🏢</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz bina eklenmedi</h3>
          <p className="mt-2 text-gray-500">İlk binanızı ekleyerek başlayın.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Bina Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <div key={building.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                    🏢
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{building.name}</h3>
                    <p className="text-sm text-gray-500">{building.city}, {building.district}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(building.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  🗑️
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Adres</span>
                  <span className="font-medium text-gray-700">{building.address}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Katlar</span>
                  <span className="font-medium text-gray-700">{building.totalFloors}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Daireler</span>
                  <span className="font-medium text-gray-700">{building.totalApartments}</span>
                </div>
              </div>

              {building.managerName && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Yönetici</p>
                  <p className="font-medium text-gray-900">{building.managerName}</p>
                  <p className="text-sm text-gray-500">{building.managerPhone}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Yeni Bina Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bina Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Kat</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalFloors}
                    onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Daire</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalApartments}
                    onChange={(e) => setFormData({ ...formData, totalApartments: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Yönetici Bilgileri (Opsiyonel)</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Yönetici Adı"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="E-posta"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
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