import { apiGet, apiSend } from './typed';

/** M1/N1: no admin read; the public `/site` is cached privately for 60 s, so revalidate. */
export const fetchSiteForAdmin = () => apiGet('/site', { cache: 'no-cache' });

export const putConfig = (key: string, value: string) =>
  apiSend('put', '/admin/site/config/{key}', { path: { key }, body: { value } });

export const deleteConfig = (key: string) =>
  apiSend('delete', '/admin/site/config/{key}', { path: { key } });
