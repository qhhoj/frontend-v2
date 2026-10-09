import { trustedUntilBackendFixed } from './backend-ask';
import { apiGet, apiGetPage, apiSend } from './typed';
import type { FlatpageBody, FlatpageRevision } from './types/flatpages-admin';

export const fetchFlatpages = (page: number) =>
  apiGetPage('/admin/site/pages', { query: { page } });
export const fetchFlatpage = (id: string) => apiGet('/admin/site/pages/{id}', { path: { id } });
export const createFlatpage = (body: FlatpageBody) =>
  apiSend('post', '/admin/site/pages', { body });
export const updateFlatpage = (id: string, patch: Partial<FlatpageBody>) =>
  apiSend('patch', '/admin/site/pages/{id}', { path: { id }, body: patch });
export const deleteFlatpage = (id: string) =>
  apiSend('delete', '/admin/site/pages/{id}', { path: { id } });

export const FLATPAGE_REVISIONS_PAGE_SIZE = 20;
/** Readable after the page is deleted; `fetchDeletedFlatpages` lists the ids. */
export const fetchFlatpageRevisions = async (id: string, page: number) => {
  const revisions = await apiGetPage('/admin/site/pages/{id}/revisions', {
    path: { id },
    query: { page },
  });
  // M7-02: the document types `changes` as `{ [key]: unknown }`; each entry is `{ before, after }`.
  return {
    ...revisions,
    items: trustedUntilBackendFixed<FlatpageRevision[]>('M7-02', revisions.items),
  };
};
export const fetchDeletedFlatpages = (page: number) =>
  apiGetPage('/admin/site/pages/deleted', { query: { page } });
