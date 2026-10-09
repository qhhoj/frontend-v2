import { apiPage, apiRequest } from './client';
import type {
  FlatpageAdmin,
  DeletedFlatpage,
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
/** Readable after the page is deleted; `fetchDeletedFlatpages` lists the ids. */
export const fetchFlatpageRevisions = (id: string, page: number) =>
  apiPage<FlatpageRevision>(`${pagesPath(id)}/revisions`, { query: { page } });
export const fetchDeletedFlatpages = (page: number) =>
  apiPage<DeletedFlatpage>(`${pagesPath()}/deleted`, { query: { page } });
