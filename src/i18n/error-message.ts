import { ApiError } from '@/api/client';
import { DEFAULT_LOCALE, i18n } from './index';

/** `errors.<code>` when the code has a message, else `errors.generic`. */
export function errorMessageKey(error: unknown): string {
  const key = `errors.${error instanceof ApiError ? error.code : 'generic'}`;
  return i18n.global.te(key, DEFAULT_LOCALE) ? key : 'errors.generic';
}
