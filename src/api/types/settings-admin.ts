import type { Schemas } from '../schemas';

/** @uiOnly the 15 registry keys the admin settings page reads (2026-10-08); the document types a key as `string`. */
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

/** @uiOnly a sealed part of a value: the API says only whether it is set, never the value. */
export interface Sealed {
  set: boolean;
}

/** `default` is the registry default redacted like `value`: a secret default reads `{ set: false }`. */
export type Setting = Omit<Schemas['SettingResponse'], 'key'> & { key: SettingKey };

export type SettingRevision = Schemas['SettingRevisionResponse'];
