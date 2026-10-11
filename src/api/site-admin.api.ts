import { apiGet, apiGetPage, apiSend } from './typed';

/** M1/N1: no admin read; the public `/site` is cached privately for 60 s, so revalidate. */
export const fetchSiteForAdmin = () => apiGet('/site', { cache: 'no-cache' });

export const putConfig = (key: string, value: string) =>
  apiSend('put', '/admin/site/config/{key}', { path: { key }, body: { value } });

export const deleteConfig = (key: string) =>
  apiSend('delete', '/admin/site/config/{key}', { path: { key } });

/** A key's changes, newest first, 20 a page; also for a deleted key. */
export const fetchConfigRevisions = (key: string, page: number) =>
  apiGetPage('/admin/site/config/{key}/revisions', { path: { key }, query: { page } });
