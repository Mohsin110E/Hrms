import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  LoginResponse,
} from './api';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: LoginResponse['user'] | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    // We don't decode the JWT here; pages that need the user should call /auth/me
    // or store minimal user info. For simplicity we leave user null until login.
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiLogin(username, password);
    const { accessToken, refreshToken, user } = response.data;
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
  };

  const logout = async () => {
    await apiLogout();
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user || !!getAccessToken(),
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
