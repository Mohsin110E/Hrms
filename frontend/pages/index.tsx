import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { getMyMenu, getUserTypes, ApiEnvelope, UserType } from '../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [menu, setMenu] = useState<any>(null);
  const [userTypes, setUserTypes] = useState<ApiEnvelope<UserType[]> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    Promise.all([getMyMenu(), getUserTypes()])
      .then(([menuRes, typesRes]) => {
        setMenu(menuRes.data);
        setUserTypes(typesRes);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of the HRMS system.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="User Types" value={userTypes?.data.length ?? '-'} color="blue" />
        <StatCard title="Modules" value="4" color="green" />
        <StatCard title="Documents" value="—" color="purple" />
        <StatCard title="Employees" value="—" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Menu</h3>
          {menu ? (
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(menu, null, 2)}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">Loading menu...</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Types</h3>
          {userTypes ? (
            <ul className="divide-y divide-gray-100">
              {userTypes.data.map((ut) => (
                <li key={ut.id} className="py-3 flex items-center justify-between">
                  <span className="font-medium text-gray-800">{ut.name}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
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
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };

  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}
