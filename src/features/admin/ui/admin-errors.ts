import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import { DEFAULT_LOCALE, i18n } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';

export type FieldErrors = Record<string, string>;

/** `admin.ui.issues.<code>` when the SPA has a text for the code, else the backend's own message. */
export function adminIssueText(issue: FieldIssue): string {
  const key = `admin.ui.issues.${issue.code}`;
  return i18n.global.te(key, DEFAULT_LOCALE) ? i18n.global.t(key) : issue.message;
}

const fromIssues = (issues: FieldIssue[]): FieldErrors => {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[issue.field] ??= adminIssueText(issue);
  return errors;
};

const fromFields = (fields: Record<string, string[]>): FieldErrors =>
  Object.fromEntries(
    Object.entries(fields)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field, messages[0]!]),
  );

/** Issues carry codes (B10); some refusals (the reserved ban reason) send only `fields`. */
export function fieldErrorsOf(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  return error.issues.length > 0 ? fromIssues(error.issues) : fromFields(error.fields);
}

/** The page-line text of a failed write: the SPA text of its code, then the wait when the server said how long (`Retry-After`). */
export function failureTextOf(error: unknown): string {
  const text = i18n.global.t(errorMessageKey(error));
  const seconds = error instanceof ApiError ? error.retryAfterSeconds : null;
  if (seconds === null) return text;
  return `${text} ${i18n.global.t('admin.ui.retryIn', { seconds })}`;
}
