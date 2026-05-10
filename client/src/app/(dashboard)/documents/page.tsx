'use client';

import { useEffect, useState, useRef } from 'react';

interface Document {
  id: string;
  name: string;
  originalName: string;
  category: string;
  mimeType: string;
  size: number;
  building?: { id: string; name: string } | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'invoice', label: 'Fatura' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'minutes', label: 'Toplantı Tutanağı' },
  { value: 'receipt', label: 'Makbuz' },
  { value: 'other', label: 'Diğer' },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as string,
    buildingId: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchDocuments();
  }, [filterCategory]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/documents?organizationId=${org.id}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'ı aşamaz');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        alert('İzin verilmeyen dosya türü');
        return;
      }
      
      setFormData({ ...formData, file });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('organizationId', org.id);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('name', formData.name);
      if (formData.buildingId) {
        formDataToSend.append('buildingId', formData.buildingId);
      }
      
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (res.ok) {
        setShowUpload(false);
        setFormData({ name: '', category: 'other', buildingId: '', file: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        const error = await res.json();
        alert(`Yükleme başarısız: ${error.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu dökümanı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('vekil_access_token');
      const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}?organizationId=${org.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    return '📁';
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      invoice: 'bg-red-100 text-red-700',
      contract: 'bg-purple-100 text-purple-700',
      minutes: 'bg-blue-100 text-blue-700',
      receipt: 'bg-green-100 text-green-700',
      other: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      invoice: 'Fatura',
      contract: 'Sözleşme',
      minutes: 'Tutanak',
      receipt: 'Makbuz',
      other: 'Diğer',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[category] || styles.other}`}>
        {labels[category] || category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dökümanlar</h1>
          <p className="text-gray-500">Döküman ve dosya yönetimi</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showUpload ? 'İptal' : '+ Yükle'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tüm Kategoriler</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Yeni Döküman Yükle</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Döküman Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Döküman adını girin"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bina (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  placeholder="Bina ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosya</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                İzin verilen: PDF, JPG, PNG, WEBP, DOCX, XLSX (Max 10MB)
              </p>
            </div>

            {formData.file && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{getFileIcon(formData.file.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{formData.file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(formData.file.size)}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </form>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz döküman yok
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex items-center gap-4"
            >
              <span className="text-3xl">{getFileIcon(doc.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
                  {getCategoryBadge(doc.category)}
                </div>
                <p className="text-sm text-gray-500 truncate">{doc.originalName}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span>{formatFileSize(doc.size)}</span>
                  {doc.building && <span>{doc.building.name}</span>}
                  <span>{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}