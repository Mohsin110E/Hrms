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

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <section style={{ marginTop: '1.5rem' }}>
        <h2>My Menu</h2>
        {menu ? (
          <pre style={{ background: '#f3f4f6', padding: '1rem', borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(menu, null, 2)}
          </pre>
        ) : (
          <p>Loading menu...</p>
        )}
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>User Types</h2>
        {userTypes ? (
          <ul>
            {userTypes.data.map((ut) => (
              <li key={ut.id}>{ut.name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading user types...</p>
        )}
      </section>
    </div>
  );
}
