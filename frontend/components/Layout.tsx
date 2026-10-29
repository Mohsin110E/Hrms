import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/users', label: 'Users', icon: '👤' },
  { href: '/employees', label: 'Employees', icon: '👥' },
  { href: '/documents', label: 'Documents', icon: '📄' },
  { href: '/masters', label: 'Masters', icon: '⚙️' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <span className="text-xl font-bold">HRMS</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const active = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => logout().then(() => router.push('/login'))}
            className="w-full px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded hover:bg-slate-700 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => router.pathname === n.href || router.pathname.startsWith(`${n.href}/`))?.label || 'HRMS'}
          </h1>
          <div className="text-sm text-gray-500">Modernized HRMS</div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
