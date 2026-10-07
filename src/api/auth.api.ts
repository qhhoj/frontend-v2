import { apiRequest } from './client';
import type { LoginBody, RegisterBody, SessionResponse } from './types/auth';

export const fetchSession = () => apiRequest<SessionResponse>('/auth/me');
export const login = (body: LoginBody) =>
  apiRequest<SessionResponse>('/auth/login', { method: 'POST', body });
export const logout = () => apiRequest<void>('/auth/logout', { method: 'POST' });
export const register = (body: RegisterBody) =>
  apiRequest<void>('/auth/register', { method: 'POST', body });
export const activate = (token: string) =>
  apiRequest<void>('/auth/activate', { method: 'POST', body: { token } });
