import type { Setting, SettingKey } from '@/api/types/settings-admin';

export type SettingKind =
  | { kind: 'timeZone' }
  | { kind: 'boolean' }
  | { kind: 'integer'; min: number; max: number }
  | { kind: 'text' }
  | { kind: 'choice'; options: readonly string[] }
  /** `allowHttp`: a plain `http://` address is accepted (the form warns about it). */
  | { kind: 'url'; allowHttp?: boolean }
  | { kind: 'secretText' }
  | { kind: 'oauth' }
  | { kind: 'webhooks' };

/** From `libs/settings/src/registry.ts` (2026-10-11). */
export const SETTING_KINDS: Record<SettingKey, SettingKind> = {
  'site.timeZone': { kind: 'timeZone' },
  'contest.officialMode': { kind: 'boolean' },
  'contest.officialModeEndsAt': { kind: 'text' },
  'contest.banAfterDisqualifications': { kind: 'integer', min: 0, max: 1000 },
  'organization.adminRoleId': { kind: 'text' },
  'problem.deleteGraceDays': { kind: 'integer', min: 1, max: 365 },
  'discord.webhooks': { kind: 'webhooks' },
  'mail.from': { kind: 'text' },
  'mail.smtpUrl': { kind: 'secretText' },
  'auth.pwnedApiUrl': { kind: 'url' },
  'auth.google': { kind: 'oauth' },
  'auth.github': { kind: 'oauth' },
  'auth.facebook': { kind: 'oauth' },
  'pdf.renderTimeoutMs': { kind: 'integer', min: 100, max: 600_000 },
  'pdf.maxBytes': { kind: 'integer', min: 1, max: 1_073_741_824 },
  'similarity.minPercent': { kind: 'integer', min: 1, max: 100 },
  'similarity.maxPairs': { kind: 'integer', min: 1, max: 20_000 },
  'similarity.maxSubmissions': { kind: 'integer', min: 2, max: 10_000 },
  'quota.enforce': { kind: 'choice', options: ['warn', 'enforce'] },
  'quota.defaultMonthlyCredits': { kind: 'integer', min: 0, max: 1_000_000 },
  'quota.defaultStorageBytes': { kind: 'integer', min: 0, max: 1_099_511_627_776 },
  'quota.cost.problem': { kind: 'integer', min: 0, max: 1000 },
  'quota.cost.contest': { kind: 'integer', min: 0, max: 1000 },
  'quota.cost.dataPer10MiB': { kind: 'integer', min: 0, max: 1000 },
  'polygon.accountName': { kind: 'text' },
  'polygon.apiKey': { kind: 'secretText' },
  'polygon.apiSecret': { kind: 'secretText' },
  'externalJudge.baseUrl': { kind: 'url', allowHttp: true },
  'externalJudge.apiToken': { kind: 'secretText' },
  'externalJudge.maxInFlight': { kind: 'integer', min: 1, max: 50 },
  'externalJudge.maxWaitMinutes': { kind: 'integer', min: 1, max: 240 },
};

export type SettingGroup =
  | 'site'
  | 'contest'
  | 'problem'
  | 'organization'
  | 'polygon'
  | 'externalJudge'
  | 'mail'
  | 'auth'
  | 'notify'
  | 'pdf'
  | 'similarity'
  | 'quota';
/** The page's group strip and sections, in this order. */
export const SETTING_GROUPS: SettingGroup[] = [
  'site',
  'contest',
  'problem',
  'organization',
  'polygon',
  'externalJudge',
  'mail',
  'auth',
  'notify',
  'pdf',
  'similarity',
  'quota',
];

export interface SettingBlockSpec {
  id: string;
  group: SettingGroup;
  keys: SettingKey[];
}
export const SETTING_BLOCKS: SettingBlockSpec[] = [
  { id: 'site', group: 'site', keys: ['site.timeZone'] },
  {
    id: 'contest',
    group: 'contest',
    keys: [
      'contest.officialMode',
      'contest.officialModeEndsAt',
      'contest.banAfterDisqualifications',
    ],
  },
  { id: 'problem', group: 'problem', keys: ['problem.deleteGraceDays'] },
  { id: 'organization', group: 'organization', keys: ['organization.adminRoleId'] },
  {
    id: 'polygon',
    group: 'polygon',
    keys: ['polygon.accountName', 'polygon.apiKey', 'polygon.apiSecret'],
  },
  {
    id: 'externalJudge',
    group: 'externalJudge',
    keys: [
      'externalJudge.baseUrl',
      'externalJudge.apiToken',
      'externalJudge.maxInFlight',
      'externalJudge.maxWaitMinutes',
    ],
  },
  { id: 'mail', group: 'mail', keys: ['mail.from', 'mail.smtpUrl'] },
  { id: 'google', group: 'auth', keys: ['auth.google'] },
  { id: 'github', group: 'auth', keys: ['auth.github'] },
  { id: 'facebook', group: 'auth', keys: ['auth.facebook'] },
  { id: 'pwned', group: 'auth', keys: ['auth.pwnedApiUrl'] },
  { id: 'discord', group: 'notify', keys: ['discord.webhooks'] },
  { id: 'pdf', group: 'pdf', keys: ['pdf.renderTimeoutMs', 'pdf.maxBytes'] },
  {
    id: 'similarity',
    group: 'similarity',
    keys: ['similarity.minPercent', 'similarity.maxPairs', 'similarity.maxSubmissions'],
  },
  {
    id: 'quota',
    group: 'quota',
    keys: [
      'quota.enforce',
      'quota.defaultMonthlyCredits',
      'quota.defaultStorageBytes',
      'quota.cost.problem',
      'quota.cost.contest',
      'quota.cost.dataPer10MiB',
    ],
  },
];

/** A block with the settings the API actually sent, in the block's key order. */
export interface ShownBlock extends SettingBlockSpec {
  settings: Setting[];
}

export function shownBlocksOf(settings: Setting[]): ShownBlock[] {
  return SETTING_BLOCKS.map((block) => ({
    ...block,
    settings: block.keys
      .map((key) => settings.find((entry) => entry.key === key))
      .filter((entry): entry is Setting => entry !== undefined),
  })).filter((block) => block.settings.length > 0);
}
