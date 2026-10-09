import { trustedUntilBackendFixed } from './backend-ask';
import { apiGet, apiGetPage, apiSend } from './typed';
import type { Setting, SettingKey } from './types/settings-admin';

export const SETTING_REVISIONS_PAGE_SIZE = 20;

/** M7-01: the document types `key` as `string`; the registry's keys are `SettingKey`. */
const withKnownKey = (setting: unknown) => trustedUntilBackendFixed<Setting>('M7-01', setting);

export const fetchSettings = async () =>
  (await apiGet('/admin/settings')).map((setting) => withKnownKey(setting));

export const updateSetting = async (key: SettingKey, value: unknown) =>
  withKnownKey(await apiSend('patch', '/admin/settings/{key}', { path: { key }, body: { value } }));

export const fetchSettingRevisions = (key: SettingKey, page: number) =>
  apiGetPage('/admin/settings/{key}/revisions', {
    path: { key },
    query: { page, pageSize: SETTING_REVISIONS_PAGE_SIZE },
  });

/**
 * The server restores the old value itself: it keeps a partly sealed key's stored secret and answers 409
 * `secret_unrestorable` for a whole secret.
 */
export const restoreSettingRevision = async (key: SettingKey, revisionId: string) =>
  withKnownKey(
    await apiSend('post', '/admin/settings/{key}/revisions/{revisionId}/restore', {
      path: { key, revisionId },
    }),
  );
