import { apiGet, apiGetPage, apiSend } from './typed';
import type { SettingKey } from './types/settings-admin';

export const SETTING_REVISIONS_PAGE_SIZE = 20;

export const fetchSettings = () => apiGet('/admin/settings');

export const updateSetting = (key: SettingKey, value: unknown) =>
  apiSend('patch', '/admin/settings/{key}', { path: { key }, body: { value } });

export const fetchSettingRevisions = (key: SettingKey, page: number) =>
  apiGetPage('/admin/settings/{key}/revisions', {
    path: { key },
    query: { page, pageSize: SETTING_REVISIONS_PAGE_SIZE },
  });

/**
 * The server restores the old value itself: it keeps a partly sealed key's stored secret and answers 409
 * `secret_unrestorable` for a whole secret.
 */
export const restoreSettingRevision = (key: SettingKey, revisionId: string) =>
  apiSend('post', '/admin/settings/{key}/revisions/{revisionId}/restore', {
    path: { key, revisionId },
  });
