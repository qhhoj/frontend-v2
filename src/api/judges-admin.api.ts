import { apiRequest } from './client';
import type { Judge, JudgePatch } from './types/judges-admin';

const judgePath = (name: string) => `/judges/${encodeURIComponent(name)}`;

export const fetchJudges = () => apiRequest<Judge[]>('/judges');
export const createJudge = (body: { name: string; description?: string }) =>
  apiRequest<{ judge: Judge; authKey: string }>('/judges', { method: 'POST', body });
export const updateJudge = (name: string, patch: JudgePatch) =>
  apiRequest<Judge>(judgePath(name), { method: 'PATCH', body: patch });
export const rotateJudgeKey = (name: string) =>
  apiRequest<{ authKey: string }>(`${judgePath(name)}/key`, { method: 'POST' });
export const disconnectJudge = (name: string, force: boolean) =>
  apiRequest<void>(`${judgePath(name)}/disconnect`, { method: 'POST', body: { force } });
