const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dqms_token');
}

export function saveToken(token: string): void {
  localStorage.setItem('dqms_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('dqms_token');
}

export function getUser(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('dqms_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveUser(user: Record<string, unknown>): void {
  localStorage.setItem('dqms_user', JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem('dqms_user');
}

// Admin token helpers
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dqms_admin_token');
}

export function saveAdminToken(token: string): void {
  localStorage.setItem('dqms_admin_token', token);
}

export function clearAdminToken(): void {
  localStorage.removeItem('dqms_admin_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: json.error || 'Something went wrong' };
    }

    return { data: json as T };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

async function adminRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: json.error || 'Something went wrong' };
    }

    return { data: json as T };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export const adminApi = {
  get: <T>(endpoint: string) => adminRequest<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    adminRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) =>
    adminRequest<T>(endpoint, { method: 'DELETE' }),
};
