import { apiPage, apiRequest } from './client';
import type {
  FlatpageAdmin,
  FlatpageBody,
  FlatpageListItem,
  FlatpageRevision,
} from './types/flatpages-admin';

const pagesPath = (id?: string) => `/admin/site/pages${id ? `/${encodeURIComponent(id)}` : ''}`;
export const fetchFlatpages = (page: number) =>
  apiPage<FlatpageListItem>(pagesPath(), { query: { page } });
export const fetchFlatpage = (id: string) => apiRequest<FlatpageAdmin>(pagesPath(id));
export const createFlatpage = (body: FlatpageBody) =>
  apiRequest<FlatpageAdmin>(pagesPath(), { method: 'POST', body });
export const updateFlatpage = (id: string, patch: Partial<FlatpageBody>) =>
  apiRequest<FlatpageAdmin>(pagesPath(id), { method: 'PATCH', body: patch });
export const deleteFlatpage = (id: string) => apiRequest<void>(pagesPath(id), { method: 'DELETE' });

export const FLATPAGE_REVISIONS_PAGE_SIZE = 20;
/** Readable after the page is deleted; a deleted page's id is only known to someone who kept it (no listing of deleted pages). */
export const fetchFlatpageRevisions = (id: string, page: number) =>
  apiPage<FlatpageRevision>(`${pagesPath(id)}/revisions`, { query: { page } });
