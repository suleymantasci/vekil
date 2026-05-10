'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
}

interface Org {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vekil_access_token');
    const storedUser = localStorage.getItem('vekil_user');
    const storedOrg = localStorage.getItem('vekil_org');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
    setOrg(JSON.parse(storedOrg));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('vekil_access_token');
    localStorage.removeItem('vekil_refresh_token');
    localStorage.removeItem('vekil_user');
    localStorage.removeItem('vekil_org');
    router.push('/login');
  };

  if (!user || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
    { href: '/buildings', label: 'Binalar', icon: '🏢' },
    { href: '/users', label: 'Kullanıcılar', icon: '👥' },
    { href: '/roles', label: 'Roller', icon: '🔐' },
    { href: '/audit', label: 'Denetim Logları', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen && <span className="font-bold text-xl">Vekil</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-800 transition"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen ? (
            <div>
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-400">{org.name}</p>
              <button
                onClick={handleLogout}
                className="mt-2 text-sm text-red-400 hover:text-red-300"
              >
                Çıkış Yap
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-800 transition text-red-400"
              title="Çıkış Yap"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {org.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user.roleName === 'ORGANIZATION_ADMIN' ? 'Yönetici' : user.roleName}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}