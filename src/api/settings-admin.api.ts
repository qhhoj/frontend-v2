import { apiPage, apiRequest } from './client';
import type { Setting, SettingKey, SettingRevision } from './types/settings-admin';

export const SETTING_REVISIONS_PAGE_SIZE = 20;
const settingPath = (key: SettingKey) => `/admin/settings/${encodeURIComponent(key)}`;

export const fetchSettings = () => apiRequest<Setting[]>('/admin/settings');

export const updateSetting = (key: SettingKey, value: unknown) =>
  apiRequest<Setting>(settingPath(key), { method: 'PATCH', body: { value } });

export const fetchSettingRevisions = (key: SettingKey, page: number) =>
  apiPage<SettingRevision>(`${settingPath(key)}/revisions`, {
    query: { page, pageSize: SETTING_REVISIONS_PAGE_SIZE },
  });

/**
 * The server restores the old value itself: it keeps a partly sealed key's stored secret and answers 409
 * `secret_unrestorable` for a whole secret.
 */
export const restoreSettingRevision = (key: SettingKey, revisionId: string) =>
  apiRequest<Setting>(`${settingPath(key)}/revisions/${encodeURIComponent(revisionId)}/restore`, {
    method: 'POST',
  });
