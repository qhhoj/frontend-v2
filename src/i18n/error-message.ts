import { ApiError } from '@/api/client';
import { DEFAULT_LOCALE, i18n } from './index';

const PAYLOAD_TOO_LARGE_STATUS = 413;

const hasText = (key: string) => i18n.global.te(key, DEFAULT_LOCALE);

/** The code that names the refusal: a 403 `forbidden` is told apart by its issue (`board_frozen`, `board_hidden`), a 413 by its status. */
function refusalCode(error: ApiError): string {
  if (error.status === PAYLOAD_TOO_LARGE_STATUS && !hasText(`errors.${error.code}`))
    return 'payload_too_large';
  const issueCode = error.issues[0]?.code;
  if (error.code === 'forbidden' && issueCode && hasText(`errors.${issueCode}`)) return issueCode;
  return error.code;
}

/** `errors.<code>` when the code has a message, else `errors.generic`. */
export function errorMessageKey(error: unknown): string {
  const key = `errors.${error instanceof ApiError ? refusalCode(error) : 'generic'}`;
  return hasText(key) ? key : 'errors.generic';
}
