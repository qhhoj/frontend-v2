import { apiGet, apiGetPage, apiSend } from './typed';
import type { DiscordEvent, DiscordWebhookSlot, SettingKey } from './types/settings-admin';

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

/** Backend `DiscordWebhooksAdminController`: one row per slot (`default` and each event), the URL masked to host and last 4 characters. */
export const fetchDiscordWebhooks = () => apiGet('/admin/discord-webhooks');
/** Sets one slot, keeping the others (the setting merges it in its write transaction); answers every row. */
export const setDiscordWebhook = (event: DiscordWebhookSlot, url: string) =>
  apiSend('put', '/admin/discord-webhooks/{event}', { path: { event }, body: { url } });
export const removeDiscordWebhook = (event: DiscordWebhookSlot) =>
  apiSend('delete', '/admin/discord-webhooks/{event}', { path: { event } });
/** Queues a test embed (204); 409 `webhook_unset` when neither the event nor `default` has a URL. */
export const testDiscordWebhook = (event: DiscordEvent) =>
  apiSend('post', '/admin/discord-webhooks/{event}/test', { path: { event } });
