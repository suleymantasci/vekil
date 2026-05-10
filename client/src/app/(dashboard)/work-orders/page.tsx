'use client';

import { useEffect, useState } from 'react';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  location?: string;
  createdAt: string;
  asset?: { name: string; building: { name: string } };
  reporter: { firstName: string; lastName: string };
  assignee?: { firstName: string; lastName: string };
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', buildingId: '' });

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      const params = new URLSearchParams({
        organizationId: org.id,
      });
      if (filter.status) params.append('status', filter.status);
      if (filter.buildingId) params.append('buildingId', filter.buildingId);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/work-orders?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setWorkOrders(data.data || []);
      }
    } catch (err) {
      console.error('Load work orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, [filter]);

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const categoryLabels: Record<string, string> = {
    electrical: '⚡ Elektrik',
    plumbing: '🔧 Tesisat',
    structural: '🏗️ Yapı',
    other: '📋 Diğer',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş Emirleri</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {workOrders.length} iş emri</p>
        </div>
        <div className="flex gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tüm Durumlar</option>
            <option value="open">Açık</option>
            <option value="in_progress">Devam Eden</option>
            <option value="pending">Bekleyen</option>
            <option value="resolved">Çözüldü</option>
            <option value="closed">Kapalı</option>
          </select>
          <button
            onClick={loadWorkOrders}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['open', 'in_progress', 'pending', 'resolved', 'closed'].map((status) => {
          const count = workOrders.filter((wo) => wo.status === status).length;
          return (
            <div key={status} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium capitalize">
                {status === 'in_progress' ? 'Devam Eden' : status === 'open' ? 'Açık' : status}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">🔧</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz iş emri yok</h3>
          <p className="mt-2 text-gray-500">Arıza veya sorun bildirimi henüz yapılmadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Öncelik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demirbaş</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atanan</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[wo.priority]}`}>
                      {wo.priority === 'urgent' ? '🔴 Acil' : wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{wo.title}</div>
                    <div className="text-sm text-gray-500">{wo.description.slice(0, 60)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    {wo.asset ? (
                      <div>
                        <div className="font-medium text-gray-900">{wo.asset.name}</div>
                        <div className="text-sm text-gray-500">{wo.asset.building.name}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {wo.assignee ? (
                      <span className="text-gray-700">{wo.assignee.firstName} {wo.assignee.lastName}</span>
                    ) : (
                      <span className="text-gray-400">Atanmadı</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[wo.status]}`}>
                      {wo.status === 'open' ? 'Açık' :
                       wo.status === 'in_progress' ? 'Devam' :
                       wo.status === 'pending' ? 'Bekleyen' :
                       wo.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(wo.createdAt).toLocaleDateString('tr-TR')}
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