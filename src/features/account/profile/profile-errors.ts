import { ApiError } from '@/api/client';
import { fieldErrorTexts } from '@/features/auth/auth-errors';
import { DEFAULT_LOCALE, i18n, translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { INTL_LOCALES, formatNumber } from '@/lib/format';
import type { LengthProblem } from './profile-draft';

const invalidKey = (field: string) => `settings.profile.invalid.${field}`;

/**
 * `/profile` answers `issues` (code + field) and English `fields` messages: the field decides the sentence, so a field
 * this form shows gets its own Vietnamese text and any other field keeps the backend's message.
 */
export const serverFieldErrors = (error: unknown): Record<string, string> =>
  Object.fromEntries(
    Object.entries(fieldErrorTexts(error)).map(([field, message]) => [
      field,
      i18n.global.te(invalidKey(field), DEFAULT_LOCALE) ? translate(invalidKey(field)) : message,
    ]),
  );

export const lengthErrors = (
  problems: readonly LengthProblem[],
  locale: Locale,
): Record<string, string> =>
  Object.fromEntries(
    problems.map(({ field, used, max }) => [
      field,
      translate(`settings.profile.tooLong.${field}`, {
        used: formatNumber(used, locale),
        max: formatNumber(max, locale),
        over: formatNumber(used - max, locale),
      }),
    ]),
  );

/** Failures with a reason of their own; anything else is the shared error text. */
const SAVE_ERROR_KEYS: Readonly<Record<string, string>> = {
  forbidden: 'settings.profile.locked',
  locked_in_official_contest: 'settings.profile.lockedOfficial',
  conflict: 'settings.profile.organizationsChanged',
  network_error: 'settings.profile.offline',
};

/** The sentence above the form for a failed save that no field explains; null when the fields do. */
export function saveErrorText(error: unknown): string | null {
  if (!error || Object.keys(fieldErrorTexts(error)).length) return null;
  const code = error instanceof ApiError ? error.code : '';
  const key = Object.hasOwn(SAVE_ERROR_KEYS, code)
    ? SAVE_ERROR_KEYS[code]!
    : errorMessageKey(error);
  return translate(key);
}

/** "Chưa lưu được. Có 2 mục cần sửa: Tên hiển thị và Giới thiệu bản thân. …" */
export function invalidSummary(fields: readonly string[], locale: Locale): string {
  const names = new Intl.ListFormat(INTL_LOCALES[locale], { type: 'conjunction' }).format(
    fields.map((field) => translate(`settings.profile.fieldName.${field}`)),
  );
  return translate('settings.profile.invalidSummary', { count: fields.length, names });
}
