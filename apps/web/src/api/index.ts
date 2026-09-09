import type { ApiError, Role, UserInfo } from '@dexcel/shared';

/** 统一请求封装：同源 /api、JSON、统一错误解析（plan.md 6.1） */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error ?? `请求失败（HTTP ${res.status}）`);
  }
  return (await res.json()) as T;
}

export interface LoginPayload {
  username: string;
  password: string;
  role: Role;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<{ user: UserInfo }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: UserInfo }>('/api/auth/me'),
};
