import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import { DEFAULT_LOCALE, i18n } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';

export type FieldErrors = Record<string, string>;

/** `admin.ui.issues.<code>` when the SPA has a text for the code, else the backend's own message. */
export function adminIssueText(issue: FieldIssue): string {
  return hasIssueText(issue.code) ? i18n.global.t(`admin.ui.issues.${issue.code}`) : issue.message;
}

/** Whether the SPA has a text for this backend issue code. */
export const hasIssueText = (code: string): boolean =>
  i18n.global.te(`admin.ui.issues.${code}`, DEFAULT_LOCALE);

/** Whether a refusal carries this issue code (`error.issues[].code`); the codes, not the English messages, name a refusal. */
export const hasIssueCode = (error: unknown, code: string): error is ApiError =>
  error instanceof ApiError && error.issues.some((issue) => issue.code === code);

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
  const text = hasIssueCode(error, 'busy')
    ? i18n.global.t('admin.ui.issues.busy')
    : i18n.global.t(errorMessageKey(error));
  const seconds = error instanceof ApiError ? error.retryAfterSeconds : null;
  if (seconds === null) return text;
  return `${text} ${i18n.global.t('admin.ui.retryIn', { seconds })}`;
}

/**
 * The record does not exist. Every backend 404 carries code `not_found` (AppError and the filter's HttpException map)
 * except the participation refusal `not_in_contest`, which is not a missing record; so the code decides, not the status.
 */
export const isNotFound = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.code === 'not_found';

/**
 * The write clashes with the stored state. Every backend 409 is a conflict, whatever its own code, so the status decides;
 * the `busy` lock refusal is only "try again", not a clash.
 */
export const isConflict = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 409 && !hasIssueCode(error, 'busy');
