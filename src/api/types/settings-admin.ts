/** backend: libs/settings registry, the 15 keys the admin settings page reads (2026-10-08). */
export type SettingKey =
  | 'site.timeZone'
  | 'contest.officialMode'
  | 'contest.banAfterDisqualifications'
  | 'discord.webhooks'
  | 'mail.from'
  | 'mail.smtpUrl'
  | 'auth.pwnedApiUrl'
  | 'auth.google'
  | 'auth.github'
  | 'auth.facebook'
  | 'pdf.renderTimeoutMs'
  | 'pdf.maxBytes'
  | 'similarity.minPercent'
  | 'similarity.maxPairs'
  | 'similarity.maxSubmissions';

/** A sealed part of a value: the API says only whether it is set, never the value. */
export interface Sealed {
  set: boolean;
}

/** `default` is the registry default redacted like `value`: a secret default reads `{ set: false }`. */
export interface Setting {
  key: SettingKey;
  description: string;
  hasSecret: boolean;
  value: unknown;
  default: unknown;
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SettingRevision {
  id: string;
  before: unknown;
  after: unknown;
  changedFields: string[];
  actor: string | null;
  createdAt: string;
}
