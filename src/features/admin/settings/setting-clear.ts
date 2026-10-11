import type { Setting, SettingKey } from '@/api/types/settings-admin';
import { SETTING_KINDS } from './setting-blocks';
import { draftOf } from './setting-values';
import type { OAuthDraft, SecretDraft } from './setting-values';

/**
 * The value that empties each sealed kind through the normal PATCH. A social login is switched off in the same write: the
 * backend refuses an enabled client without a secret, so `{ clientSecret: '' }` alone would be a 400 for an enabled one.
 */
export function clearValueOf(setting: Setting): unknown {
  const { kind } = SETTING_KINDS[setting.key];
  if (kind === 'secretText') return '';
  if (kind === 'oauth') return { enabled: false, clientSecret: '' };
  throw new Error(`${setting.key} has no secret to clear`);
}

/** The Discord webhooks are removed one event at a time in their own table, so they have no clear-all. */
export function isClearable(setting: Setting): boolean {
  const { kind } = SETTING_KINDS[setting.key];
  const draft = draftOf(setting);
  if (kind === 'secretText') return (draft as SecretDraft).isSet;
  return kind === 'oauth' && (draft as OAuthDraft).secretSet;
}

const PLAIN_CONSEQUENCES: Partial<Record<SettingKey, string[]>> = {
  'mail.smtpUrl': ['mailOff', 'notRestorable', 'senderKept'],
  'polygon.apiKey': ['polygonOff', 'notRestorable'],
  'polygon.apiSecret': ['polygonOff', 'notRestorable'],
};

/** Ids under `admin.settings.clear.consequences`: what stops, that the history keeps no value, what stays. */
export function clearConsequences(setting: Setting): string[] {
  if (SETTING_KINDS[setting.key].kind !== 'oauth')
    return PLAIN_CONSEQUENCES[setting.key] ?? ['notRestorable'];
  const isEnabled = (draftOf(setting) as OAuthDraft).enabled;
  return [...(isEnabled ? ['providerOff'] : []), 'notRestorable', 'clientIdKept'];
}
