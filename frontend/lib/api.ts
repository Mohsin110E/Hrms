export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/api/v1';

export interface ApiEnvelope<T> {
  data: T;
  message?: { code: string; text: string };
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
  user: {
    id: number;
    username: string;
    userTypeId: number;
    profileId: number;
  };
}

export interface UserType {
  id: number;
  name: string;
  isActive: boolean;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return accessToken || localStorage.getItem('accessToken');
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function clearTokens() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const url = `${API_BASE_URL}${path}`;
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.message?.text || response.statusText);
  }

  return json as ApiEnvelope<T>;
}

export async function login(username: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await request('/auth/logout', {
      method: 'POST',
      headers: { 'X-Refresh-Token': refreshToken },
    }).catch(() => {
      // ignore
    });
  }
  clearTokens();
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  return request<Pick<LoginResponse, 'accessToken' | 'refreshToken' | 'expiresIn'>>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getUserTypes() {
  return request<UserType[]>('/rbac/user-types');
}

export async function getMyMenu() {
  return request<any>('/rbac/my-menu');
}
