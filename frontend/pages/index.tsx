import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { getMyMenu, getUserTypes, getUsers, getEmployees, getDocuments, getDepartments, ApiEnvelope, UserType } from '../lib/api';

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const statsConfig = [
  { key: 'users', title: 'Total Users', icon: UsersIcon, color: 'blue' as const },
  { key: 'employees', title: 'Employees', icon: UserGroupIcon, color: 'green' as const },
  { key: 'documents', title: 'Documents', icon: DocumentIcon, color: 'purple' as const },
  { key: 'departments', title: 'Departments', icon: CogIcon, color: 'orange' as const },
];

const quickLinks = [
  { href: '/users', title: 'Manage Users', description: 'Create, reset passwords and deactivate accounts.', icon: UsersIcon, color: 'blue' as const },
  { href: '/employees', title: 'Manage Employees', description: 'Add employee profiles, sites and departments.', icon: UserGroupIcon, color: 'green' as const },
  { href: '/documents', title: 'Manage Documents', description: 'Upload and track employee documents.', icon: DocumentIcon, color: 'purple' as const },
  { href: '/masters', title: 'Manage Masters', description: 'Departments, sites, shifts and document types.', icon: CogIcon, color: 'orange' as const },
];

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [menu, setMenu] = useState<any>(null);
  const [userTypes, setUserTypes] = useState<ApiEnvelope<UserType[]> | null>(null);
  const [counts, setCounts] = useState<Record<string, number | null>>({
    users: null,
    employees: null,
    documents: null,
    departments: null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    Promise.all([
      getMyMenu(),
      getUserTypes(),
      getUsers({ pageSize: 1 }),
      getEmployees({ pageSize: 1 }),
      getDocuments({ pageSize: 1 }),
      getDepartments({ pageSize: 1 }),
    ])
      .then(([menuRes, typesRes, usersRes, employeesRes, documentsRes, departmentsRes]) => {
        setMenu(menuRes.data);
        setUserTypes(typesRes);
        setCounts({
          users: usersRes.pagination?.totalItems ?? 0,
          employees: employeesRes.pagination?.totalItems ?? 0,
          documents: documentsRes.pagination?.totalItems ?? 0,
          departments: departmentsRes.pagination?.totalItems ?? 0,
        });
      })
      .catch((err) => {
        setError(err.message);
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
          logout();
        }
      });
  }, [isAuthenticated, isLoading, router, logout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <h2 className="text-2xl lg:text-3xl font-bold">Welcome back, {user?.username || 'Admin'} 👋</h2>
        <p className="mt-2 text-blue-100 max-w-2xl">
          Here is an overview of your HRMS. Use the quick links below to manage users, employees, documents and master data.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={counts[stat.key] ?? '—'}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick links */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <a className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${colorClasses[link.color].bg} ${colorClasses[link.color].icon}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{link.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{link.description}</p>
                </a>
              </Link>
            );
          })}
        </div>

        {/* Side panels */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Types</h3>
            {userTypes ? (
              <ul className="divide-y divide-gray-100">
                {userTypes.data.map((ut) => (
                  <li key={ut.id} className="py-3 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{ut.name}</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        ut.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ut.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
            )}
          </div>

          {menu && Array.isArray(menu) && menu.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Menu</h3>
              <ul className="divide-y divide-gray-100">
                {menu.slice(0, 6).map((item: any, idx: number) => (
                  <li key={idx} className="py-2 text-sm text-gray-700">
                    {item.label || item.name || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const colorClasses = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700', border: 'border-blue-100' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-700', border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700', border: 'border-purple-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-700', border: 'border-orange-100' },
};

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const Icon = icon;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colorClasses[color].text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color].bg} ${colorClasses[color].icon}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}
