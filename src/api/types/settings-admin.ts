import type { Schemas } from '../schemas';

export type SettingKey = Schemas['SettingKey'];

/** @uiOnly a sealed part of a value: the API says only whether it is set, never the value. */
export interface Sealed {
  set: boolean;
}

/** `default` is the registry default redacted like `value`: a secret default reads `{ set: false }`. */
export type Setting = Schemas['SettingResponse'];

export type SettingRevision = Schemas['SettingRevisionResponse'];
