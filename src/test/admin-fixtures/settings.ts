import type { Setting, SettingKey, SettingRevision } from '../../api/types/settings-admin';

const SEALED_KEYS: SettingKey[] = [
  'mail.smtpUrl',
  'discord.webhooks',
  'auth.google',
  'auth.github',
  'auth.facebook',
];

/** One setting as the API sends it: the default is the value unless overridden, and it is the default. */
export function setting(
  key: SettingKey,
  value: unknown,
  overrides: Partial<Setting> = {},
): Setting {
  return {
    key,
    description: `English description of ${key}.`,
    hasSecret: SEALED_KEYS.includes(key),
    value,
    default: value,
    isDefault: true,
    updatedAt: '2026-10-08T03:41:00.000Z',
    updatedBy: '0192a000-0000-7000-8000-00000000b001',
    ...overrides,
  };
}

/** The 17 registry keys with the board's values (the pdf and similarity numbers are the board's). */
export const ALL_SETTINGS: Setting[] = [
  setting('site.timeZone', 'Asia/Ho_Chi_Minh'),
  setting('contest.officialMode', false),
  setting('contest.officialModeEndsAt', ''),
  setting('contest.banAfterDisqualifications', 0),
  setting('problem.deleteGraceDays', 30),
  setting('discord.webhooks', { set: true }, { default: { set: false } }),
  setting('mail.from', 'QHHOJ <no-reply@qhhoj.example>'),
  setting('mail.smtpUrl', { set: true }, { default: { set: false } }),
  setting('auth.pwnedApiUrl', ''),
  setting(
    'auth.google',
    { enabled: true, clientId: '1048000000001', clientSecret: { set: true } },
    { default: { enabled: false, clientId: '', clientSecret: { set: false } } },
  ),
  setting(
    'auth.github',
    { enabled: false, clientId: '', clientSecret: { set: false } },
    { default: { enabled: false, clientId: '', clientSecret: { set: false } } },
  ),
  setting(
    'auth.facebook',
    { enabled: false, clientId: '', clientSecret: { set: false } },
    { default: { enabled: false, clientId: '', clientSecret: { set: false } } },
  ),
  setting('pdf.renderTimeoutMs', 45000, { default: 30000, isDefault: false }),
  setting('pdf.maxBytes', 52428800),
  setting('similarity.minPercent', 50),
  setting('similarity.maxPairs', 5000),
  setting('similarity.maxSubmissions', 3000),
];

/** A revision of one key; `before` and `after` are whole values, or the field maps of a multi-field key. */
export function settingRevision(
  before: unknown,
  after: unknown,
  changedFields: string[] = ['value'],
): SettingRevision {
  return {
    id: 'rev-1',
    before,
    after,
    changedFields,
    actor: '0192a000-0000-7000-8000-00000000b001',
    createdAt: '2026-10-08T03:41:00.000Z',
  };
}
