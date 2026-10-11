import { apiGet, apiGetPage, apiSend } from './typed';
import type { FlatpageBody } from './types/flatpages-admin';

/** `search`: the url or the title contains it. */
export const fetchFlatpages = (page: number, search = '') =>
  apiGetPage('/admin/site/pages', { query: { page, ...(search ? { search } : {}) } });
export const fetchFlatpage = (id: string) => apiGet('/admin/site/pages/{id}', { path: { id } });
export const createFlatpage = (body: FlatpageBody) =>
  apiSend('post', '/admin/site/pages', { body });
export const updateFlatpage = (id: string, patch: Partial<FlatpageBody>) =>
  apiSend('patch', '/admin/site/pages/{id}', { path: { id }, body: patch });
export const deleteFlatpage = (id: string) =>
  apiSend('delete', '/admin/site/pages/{id}', { path: { id } });

export const FLATPAGE_REVISIONS_PAGE_SIZE = 20;
/** Readable after the page is deleted; `fetchDeletedFlatpages` lists the ids. */
export const fetchFlatpageRevisions = (id: string, page: number) =>
  apiGetPage('/admin/site/pages/{id}/revisions', { path: { id }, query: { page } });
export const fetchDeletedFlatpages = (page: number) =>
  apiGetPage('/admin/site/pages/deleted', { query: { page } });
