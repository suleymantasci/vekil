'use client';

import { useEffect, useState } from 'react';

interface Meter {
  id: string;
  meterNumber: string;
  meterType: 'ELECTRICITY' | 'WATER' | 'GAS' | 'HEATING';
  location: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  lastReading: number;
  lastReadingDate: string | null;
  createdAt: string;
  building: { id: string; name: string };
  apartment: { id: string; unitNumber: string } | null;
}

interface Reading {
  id: string;
  reading: number;
  readingDate: string;
  previousReading: number | null;
  consumption: number | null;
  readBy: string | null;
}

const METER_TYPES: Record<string, string> = {
  ELECTRICITY: 'Elektrik',
  WATER: 'Su',
  GAS: 'Doğalgaz',
  HEATING: 'Kalorimetre',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
};

export default function MetersPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [formData, setFormData] = useState({
    buildingId: '',
    apartmentId: '',
    meterNumber: '',
    meterType: 'ELECTRICITY' as const,
    location: '',
    initialReading: '',
  });
  const [readingForm, setReadingForm] = useState({
    reading: '',
    readingDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMeters();
  }, [filterType]);

  const fetchMeters = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      let url = `http://localhost:3000/api/meters?organizationId=${org.id}`;
      if (filterType) url += `&meterType=${filterType}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMeters(data);
      }
    } catch (error) {
      console.error('Failed to fetch meters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async (meterId: string) => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`http://localhost:3000/api/meters/${meterId}/readings?organizationId=${org.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setReadings(data);
      }
    } catch (error) {
      console.error('Failed to fetch readings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch('http://localhost:3000/api/meters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: org.id,
          initialReading: formData.initialReading ? parseFloat(formData.initialReading) : 0,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          buildingId: '',
          apartmentId: '',
          meterNumber: '',
          meterType: 'ELECTRICITY',
          location: '',
          initialReading: '',
        });
        fetchMeters();
      }
    } catch (error) {
      console.error('Failed to create meter:', error);
    }
  };

  const handleReadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMeter) return;
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch('http://localhost:3000/api/meters/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: org.id,
          meterId: selectedMeter.id,
          reading: parseFloat(readingForm.reading),
          readingDate: new Date(readingForm.readingDate),
        }),
      });

      if (res.ok) {
        setShowReadingForm(false);
        setReadingForm({
          reading: '',
          readingDate: new Date().toISOString().split('T')[0],
        });
        fetchReadings(selectedMeter.id);
        fetchMeters();
      }
    } catch (error) {
      console.error('Failed to submit reading:', error);
    }
  };

  const openReadingModal = (meter: Meter) => {
    setSelectedMeter(meter);
    fetchReadings(meter.id);
    setShowReadingForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sayaç Yönetimi</h1>
          <p className="text-gray-500">Elektrik, su, doğalgaz ve kalorimetre takibi</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : '+ Sayaç Ekle'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tüm Türler</option>
          <option value="ELECTRICITY">Elektrik</option>
          <option value="WATER">Su</option>
          <option value="GAS">Doğalgaz</option>
          <option value="HEATING">Kalorimetre</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Yeni Sayaç Ekle</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Sayaç Numarası</label>
                <input
                  type="text"
                  value={formData.meterNumber}
                  onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <select
                  value={formData.meterType}
                  onChange={(e) => setFormData({ ...formData, meterType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="ELECTRICITY">Elektrik</option>
                  <option value="WATER">Su</option>
                  <option value="GAS">Doğalgaz</option>
                  <option value="HEATING">Kalorimetre</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Örn: Bodrum kat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlk Okuma (Opsiyonel)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initialReading}
                  onChange={(e) => setFormData({ ...formData, initialReading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sayaç Ekle
            </button>
          </form>
        </div>
      )}

      {/* Meters List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : meters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz sayaç yok
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {meters.map((meter) => (
            <div
              key={meter.id}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {meter.meterType === 'ELECTRICITY' ? '⚡' : 
                       meter.meterType === 'WATER' ? '💧' :
                       meter.meterType === 'GAS' ? '🔥' : '🌡️'}
                    </span>
                    <h3 className="font-semibold text-gray-900">{meter.meterNumber}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[meter.status]}`}>
                      {meter.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {METER_TYPES[meter.meterType]} - {meter.building.name}
                    {meter.apartment && ` / ${meter.apartment.unitNumber}`}
                  </p>
                  {meter.location && (
                    <p className="text-xs text-gray-400 mt-1">📍 {meter.location}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Son Okuma</p>
                    <p className="text-lg font-bold text-gray-900">{meter.lastReading.toLocaleString('tr-TR')}</p>
                    {meter.lastReadingDate && (
                      <p className="text-xs text-gray-400">
                        {new Date(meter.lastReadingDate).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openReadingModal(meter)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                  >
                    Okuma Ekle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reading Modal */}
      {showReadingForm && selectedMeter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowReadingForm(false)} />
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {selectedMeter.meterNumber} - Okuma Ekle
            </h2>
            
            <form onSubmit={handleReadingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Okuma</label>
                <input
                  type="number"
                  step="0.01"
                  value={readingForm.reading}
                  onChange={(e) => setReadingForm({ ...readingForm, reading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={readingForm.readingDate}
                  onChange={(e) => setReadingForm({ ...readingForm, readingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500">
                  Son okuma: <span className="font-medium">{selectedMeter.lastReading.toLocaleString('tr-TR')}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReadingForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </form>

            {/* Recent Readings */}
            {readings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Son Okumalar</h3>
                <div className="space-y-2">
                  {readings.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(r.readingDate).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="font-medium">{r.reading.toLocaleString('tr-TR')}</span>
                      {r.consumption !== null && (
                        <span className={`text-xs ${r.consumption >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {r.consumption >= 0 ? '+' : ''}{r.consumption.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}