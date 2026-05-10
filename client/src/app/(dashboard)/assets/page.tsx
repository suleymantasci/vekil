'use client';

import { useEffect, useState } from 'react';

interface Asset {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  location?: string;
  warrantyEnd?: string;
  building: { id: string; name: string };
  _count: { workOrders: number };
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ buildingId: '', type: '' });

  const loadAssets = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      const params = new URLSearchParams({ organizationId: org.id });
      if (filter.buildingId) params.append('buildingId', filter.buildingId);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assets?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setAssets(data.data || []);
      }
    } catch (err) {
      console.error('Load assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [filter]);

  const typeIcons: Record<string, string> = {
    elevator: '🛗',
    generator: '⚡',
    pool: '🏊',
    hvac: '❄️',
    other: '📦',
  };

  const typeLabels: Record<string, string> = {
    elevator: 'Asansör',
    generator: 'Jeneratör',
    pool: 'Havuz',
    hvac: 'HVAC',
    other: 'Diğer',
  };

  const getWarrantyStatus = (warrantyEnd?: string) => {
    if (!warrantyEnd) return { label: 'Bilinmiyor', color: 'bg-gray-100 text-gray-500' };
    
    const end = new Date(warrantyEnd);
    const now = new Date();
    const daysLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { label: 'Süresi Dolmuş', color: 'bg-red-100 text-red-700' };
    if (daysLeft <= 30) return { label: `${daysLeft} gün kaldı`, color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Aktif', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demirbaşlar</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {assets.length} demirbaş</p>
        </div>
        <button
          onClick={loadAssets}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['elevator', 'generator', 'pool', 'hvac', 'other'].map((type) => {
          const count = assets.filter((a) => a.type === type).length;
          return (
            <div key={type} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[type]}</span>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{typeLabels[type]}</p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">📦</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz demirbaş eklenmedi</h3>
          <p className="mt-2 text-gray-500">Bina demirbaşlarını (asansör, jeneratör, havuz vb.) buradan yönetebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const warranty = getWarrantyStatus(asset.warrantyEnd);
            return (
              <div key={asset.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                      {typeIcons[asset.type] || '📦'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                      <p className="text-sm text-gray-500">{asset.building.name}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tür</span>
                    <span className="font-medium text-gray-700">{typeLabels[asset.type] || asset.type}</span>
                  </div>
                  {asset.brand && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Marka</span>
                      <span className="font-medium text-gray-700">{asset.brand}</span>
                    </div>
                  )}
                  {asset.serialNo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Seri No</span>
                      <span className="font-medium text-gray-700 font-mono text-xs">{asset.serialNo}</span>
                    </div>
                  )}
                  {asset.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Konum</span>
                      <span className="font-medium text-gray-700">{asset.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${warranty.color}`}>
                      {warranty.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {asset._count.workOrders} iş emri
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}