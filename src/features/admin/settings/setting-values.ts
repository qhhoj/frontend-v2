import type { Setting } from '@/api/types/settings-admin';
import { i18n, translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { SETTING_KINDS } from './setting-blocks';

export interface ScalarDraft {
  value: unknown;
}
export interface SecretDraft {
  isSet: boolean;
  isReplacing: boolean;
  replacement: string;
}
export interface OAuthDraft {
  enabled: boolean;
  clientId: string;
  secretSet: boolean;
  isReplacing: boolean;
  secret: string;
}
/** The webhooks are edited one event at a time by their own table (`DiscordWebhooksTable`), never through the block's save. */
export interface WebhooksDraft {
  isSet: boolean;
}
export type SettingDraft = ScalarDraft | SecretDraft | OAuthDraft | WebhooksDraft;

const isSealedSet = (value: unknown) =>
  typeof value === 'object' && value !== null && (value as { set?: unknown }).set === true;

export function draftOf(setting: Setting): SettingDraft {
  const { kind } = SETTING_KINDS[setting.key];
  if (kind === 'secretText')
    return { isSet: isSealedSet(setting.value), isReplacing: false, replacement: '' };
  if (kind === 'webhooks') return { isSet: isSealedSet(setting.value) };
  if (kind === 'oauth') {
    const value = setting.value as { enabled: boolean; clientId: string; clientSecret: unknown };
    return {
      enabled: value.enabled,
      clientId: value.clientId,
      secretSet: isSealedSet(value.clientSecret),
      isReplacing: false,
      secret: '',
    };
  }
  return { value: setting.value };
}

/** Sends only the OAuth fields that changed; a secret only when "Thay thế" was used and something was typed. */
function oauthToSend(setting: Setting, draft: OAuthDraft) {
  const stored = setting.value as { enabled: boolean; clientId: string };
  const value: Record<string, unknown> = {};
  if (draft.enabled !== stored.enabled || draft.clientId !== stored.clientId)
    Object.assign(value, { enabled: draft.enabled, clientId: draft.clientId });
  const typedSecret = draft.secret.trim();
  if (draft.isReplacing && typedSecret !== '') value.clientSecret = typedSecret;
  return Object.keys(value).length > 0 ? { value } : null;
}

/**
 * `null` = nothing to send. A sealed part is sent only when the user chose to replace it and typed something: an empty
 * box keeps the stored secret, so "Thay thế" with nothing typed never wipes it (clearing is Task 6c's button).
 */
export function valueToSend(setting: Setting, draft: SettingDraft): { value: unknown } | null {
  const { kind } = SETTING_KINDS[setting.key];
  if (kind === 'oauth') return oauthToSend(setting, draft as OAuthDraft);
  if (kind === 'secretText') {
    const secret = draft as SecretDraft;
    const typed = secret.replacement.trim();
    return secret.isReplacing && typed !== '' ? { value: typed } : null;
  }
  if (kind === 'webhooks') return null;
  const { value } = draft as ScalarDraft;
  return JSON.stringify(value) === JSON.stringify(setting.value) ? null : { value };
}

function integerProblem(value: unknown, min: number, max: number) {
  const locale = i18n.global.locale.value;
  const isInRange =
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
  return isInRange
    ? null
    : translate('admin.settings.errors.integer', {
        min: formatNumber(min, locale),
        max: formatNumber(max, locale),
      });
}

/** Client-side range and format text for a draft; `null` when it may be sent. */
export function checkDraft(setting: Setting, draft: SettingDraft): string | null {
  const kind = SETTING_KINDS[setting.key];
  if (kind.kind === 'integer')
    return integerProblem((draft as ScalarDraft).value, kind.min, kind.max);
  if (kind.kind === 'url') {
    const raw = (draft as ScalarDraft).value;
    const value = typeof raw === 'string' ? raw : '';
    const isAllowed =
      value.startsWith('https://') || (kind.allowHttp && value.startsWith('http://'));
    if (value === '' || isAllowed) return null;
    return translate(
      kind.allowHttp
        ? 'admin.settings.errors.httpOrHttpsOrEmpty'
        : 'admin.settings.errors.httpsOrEmpty',
    );
  }
  return null;
}
