'use client';

import { useEffect, useState } from 'react';

interface TahakkukRule {
  id: string;
  name: string;
  chargeType: string;
  calculationType: string;
  amount: number;
  dueDay: number;
  building?: { name: string };
  description?: string;
  isActive: boolean;
}

export default function TahakkukRulesPage() {
  const [rules, setRules] = useState<TahakkukRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    chargeType: 'MONTHLY_FEE',
    calculationType: 'fixed',
    amount: '',
    dueDay: '5',
    buildingId: '',
    description: '',
  });

  const loadRules = async () => {
    setLoading(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tahakkuk/rules?organizationId=${org.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setRules(data.data || []);
      }
    } catch (err) {
      console.error('Load rules error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tahakkuk/rules?organizationId=${org.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
            dueDay: parseInt(formData.dueDay),
            buildingId: formData.buildingId || undefined,
          }),
        }
      );
      
      setShowModal(false);
      setFormData({
        name: '',
        chargeType: 'MONTHLY_FEE',
        calculationType: 'fixed',
        amount: '',
        dueDay: '5',
        buildingId: '',
        description: '',
      });
      loadRules();
    } catch (err) {
      console.error('Create rule error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return;
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tahakkuk/rules/${id}?organizationId=${org.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      loadRules();
    } catch (err) {
      console.error('Delete rule error:', err);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Bu dönem için tahakkuk oluşturmak istediğinize emin misiniz?')) return;
    
    setGenerating(true);
    try {
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      const token = localStorage.getItem('vekil_access_token');
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tahakkuk/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            organizationId: org.id,
            period,
            rules: rules.map(r => ({
              name: r.name,
              chargeType: r.chargeType,
              calculationType: r.calculationType,
              amount: r.amount,
              dueDay: r.dueDay,
              buildingId: (r as any).buildingId,
            })),
          }),
        }
      );
      
      const data = await res.json();
      alert(`Tahakkuk oluşturuldu: ${data.chargesCreated || 0} borç kaydı.`);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const calculationTypeLabels: Record<string, string> = {
    fixed: 'Sabit Tutar',
    'area_m2': 'm² Bazlı',
    'share_ratio': 'Arsa Payı',
  };

  const chargeTypeLabels: Record<string, string> = {
    MONTHLY_FEE: 'Aylık Aidat',
    CONSUMPTION: 'Tüketim',
    DUES: 'Diğer Aidatlar',
    PENALTY: 'Ceza',
    OTHER: 'Diğer',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aidat Kuralları</h1>
          <p className="text-gray-500 text-sm mt-1">Tahakkuk için aidat kurallarını yönetin</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={rules.length === 0 || generating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {generating ? 'Oluşturuluyor...' : '📌 Tahakkuk Oluştur'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Yeni Kural
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <span className="text-5xl">📋</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz kural eklenmedi</h3>
          <p className="mt-2 text-gray-500">İlk aidat kuralınızı oluşturarak başlayın.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Kural Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                  <p className="text-sm text-gray-500">{rule.building?.name || 'Tüm Binalar'}</p>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  🗑️
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tür</span>
                  <span className="font-medium text-gray-700">
                    {chargeTypeLabels[rule.chargeType] || rule.chargeType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hesaplama</span>
                  <span className="font-medium text-gray-700">
                    {calculationTypeLabels[rule.calculationType]}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tutar/Oran</span>
                  <span className="font-bold text-blue-600">
                    {rule.calculationType === 'fixed'
                      ? `${rule.amount.toLocaleString('tr-TR')} ₺`
                      : rule.calculationType === 'area_m2'
                        ? `${rule.amount} ₺/m²`
                        : `${rule.amount}₺ × pay`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vade Günü</span>
                  <span className="font-medium text-gray-700">Her ayın {rule.dueDay}. günü</span>
                </div>
              </div>

              {rule.description && (
                <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  {rule.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Yeni Aidat Kuralı</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kural Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Örn: Aylık Aidat"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    value={formData.chargeType}
                    onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="MONTHLY_FEE">Aylık Aidat</option>
                    <option value="CONSUMPTION">Tüketim</option>
                    <option value="DUES">Diğer Aidatlar</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hesaplama</label>
                  <select
                    value={formData.calculationType}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="fixed">Sabit Tutar</option>
                    <option value="area_m2">m² Bazlı</option>
                    <option value="share_ratio">Arsa Payı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.calculationType === 'fixed' ? 'Tutar (₺)' :
                   formData.calculationType === 'area_m2' ? 'm² Başına Tutar (₺)' : 'Pay Başına Tutar (₺)'}
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Vade Günü (1-28)</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.dueDay}
                  onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Bu kural hakkında not..."
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