'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[DEBUG] authApi.login called with email:', email);
      const { data } = await authApi.login(email, password);
      console.log('[DEBUG] authApi.login returned data:', JSON.stringify(data));
      console.log('[DEBUG] data.accessToken:', data?.accessToken);
      console.log('[DEBUG] data.user:', data?.user);
      console.log('[DEBUG] data.organization:', data?.organization);
      
      localStorage.setItem('vekil_access_token', data.accessToken ?? '');
      localStorage.setItem('vekil_refresh_token', data.refreshToken ?? '');
      localStorage.setItem('vekil_user', JSON.stringify(data.user ?? null));
      localStorage.setItem('vekil_org', JSON.stringify(data.organization ?? null));
      console.log('[DEBUG] localStorage set, navigating to dashboard...');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('[DEBUG] Login error:', err);
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Vekil</h1>
            <p className="text-gray-500 mt-2">Apartman ve Site Yönetimi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Hesabınız yok mu?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Kayıt Ol
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
