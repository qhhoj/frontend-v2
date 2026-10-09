import { apiRequest } from './client';
import type { SiteData } from './types/site-admin';

/** M1/N1: no admin read; the public `/site` is cached privately for 60 s, so revalidate. */
export const fetchSiteForAdmin = () => apiRequest<SiteData>('/site', { cache: 'no-cache' });

export const putConfig = (key: string, value: string) =>
  apiRequest<{ key: string; value: string }>(`/admin/site/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: { value },
  });

export const deleteConfig = (key: string) =>
  apiRequest<void>(`/admin/site/config/${encodeURIComponent(key)}`, { method: 'DELETE' });
