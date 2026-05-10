'use client';

import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  referenceNo: string | null;
  transactionDate: string;
  building: { id: string; name: string } | null;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, { income: number; expense: number }>;
  transactionCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  DUES_INCOME: 'Aidat Geliri',
  PAYMENT_INCOME: 'Gecikme Faizi',
  OTHER_INCOME: 'Diğer Gelir',
  MAINTENANCE_EXPENSE: 'Bakım/Onarım',
  UTILITY_EXPENSE: 'Elektrik/Su/Doğalgaz',
  PERSONNEL_EXPENSE: 'Personel',
  INSURANCE_EXPENSE: 'Sigorta',
  OTHER_EXPENSE: 'Diğer Gider',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: 'DUES_INCOME',
    amount: '',
    description: '',
    referenceNo: '',
    transactionDate: new Date().toISOString().split('T')[0],
    buildingId: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [filterType]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/accounting/transactions?organizationId=${org.id}`;
      if (filterType) url += `&type=${filterType}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/summary?organizationId=${org.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: org.id,
          amount: parseFloat(formData.amount),
          transactionDate: new Date(formData.transactionDate),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          type: 'INCOME',
          category: 'DUES_INCOME',
          amount: '',
          description: '',
          referenceNo: '',
          transactionDate: new Date().toISOString().split('T')[0],
          buildingId: '',
        });
        fetchTransactions();
        fetchSummary();
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/transactions/${id}?organizationId=${org.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchTransactions();
        fetchSummary();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => CATEGORY_LABELS[category] || category;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Muhasebe</h1>
          <p className="text-gray-500">Gelir-gider takibi ve raporlama</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : '+ İşlem Ekle'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <p className="text-sm text-green-600 font-medium">Toplam Gelir</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-red-100">
            <p className="text-sm text-red-600 font-medium">Toplam Gider</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(summary.totalExpense)}</p>
          </div>
          <div className={`rounded-xl p-6 border ${summary.balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className={`text-sm font-medium ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Bakiye</p>
            <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tüm İşlemler</option>
          <option value="INCOME">Gelir</option>
          <option value="EXPENSE">Gider</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Yeni İşlem</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="INCOME">Gelir</option>
                  <option value="EXPENSE">Gider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
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
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referans No (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bina ID (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Kaydet
            </button>
          </form>
        </div>
      )}

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz işlem yok
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tarih</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tür</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Açıklama</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Tutar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(tx.transactionDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'INCOME' ? 'Gelir' : 'Gider'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getCategoryLabel(tx.category)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {tx.description}
                    {tx.referenceNo && <span className="text-gray-400 ml-2">#{tx.referenceNo}</span>}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Sil
                    </button>
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