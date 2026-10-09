import { apiRequest } from './client';
import type { NavigationBody, NavigationItem, SiteData } from './types/site-admin';

/** M1/N1: no admin read; the public `/site` is cached privately for 60 s, so revalidate. */
export const fetchSiteForAdmin = () => apiRequest<SiteData>('/site', { cache: 'no-cache' });

export const putConfig = (key: string, value: string) =>
  apiRequest<{ key: string; value: string }>(`/admin/site/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: { value },
  });

export const deleteConfig = (key: string) =>
  apiRequest<void>(`/admin/site/config/${encodeURIComponent(key)}`, { method: 'DELETE' });

const navigationPath = (id?: string) =>
  `/admin/site/navigation${id ? `/${encodeURIComponent(id)}` : ''}`;

export const createNavItem = (body: NavigationBody) =>
  apiRequest<NavigationItem>(navigationPath(), { method: 'POST', body });

export const updateNavItem = (id: string, patch: Partial<NavigationBody>) =>
  apiRequest<NavigationItem>(navigationPath(id), { method: 'PATCH', body: patch });

export const deleteNavItem = (id: string) =>
  apiRequest<void>(navigationPath(id), { method: 'DELETE' });
