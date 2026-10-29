import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/">
          <a style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: '#111' }}>
            HRMS
          </a>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {isAuthenticated ? (
            <>
              <Link href="/">
                <a style={{ textDecoration: 'none', color: '#374151' }}>Dashboard</a>
              </Link>
              <button
                onClick={() => logout().then(() => window.location.assign('/login'))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#374151',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <a style={{ textDecoration: 'none', color: '#374151' }}>Login</a>
            </Link>
          )}
        </nav>
      </header>
      <main style={{ padding: '1.5rem' }}>{children}</main>
    </div>
  );
}
