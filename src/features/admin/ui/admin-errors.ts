import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import type { QuotaRefusal } from '@/api/types/organization-usage';
import { DEFAULT_LOCALE, i18n, isLocale } from '@/i18n';
import type { Locale } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { formatNumber } from '@/lib/format';
import { formatMebibytes } from '@/lib/quota';

export type FieldErrors = Record<string, string>;

const currentLocale = (): Locale => {
  const locale = i18n.global.locale.value;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
};

/** The class-validator codes: they say a value is off, not why, so a page line prefers the specific refusal beside them. */
const GENERIC_VALIDATOR_CODES: ReadonlySet<string> = new Set([
  'max',
  'min',
  'max_length',
  'min_length',
  'is_length',
  'matches',
  'is_not_empty',
  'must_not_be_null',
  'is_uuid',
  'is_timestamp',
  'array_max_size',
  'array_min_size',
  'is_int',
  'is_in',
  'is_number',
  'is_boolean',
  'is_url',
  'is_object',
]);

/**
 * Refusals the backend words only in English and sends without a code, matched by their message until it sends one:
 * each maps to an `admin.ui.issues.<code>` text.
 */
const CODE_BY_MESSAGE: Readonly<Record<string, string>> = {
  'Slug is taken.': 'slug_taken',
  'Unknown user.': 'user_unknown',
  'Every assignee must be an active user': 'assignee_unknown',
  'The judge does not run test generators; delete the generator.': 'generator_unsupported',
  'The judge does not support nobigmath; turn it off.': 'nobigmath_unsupported',
  'That key is taken.': 'key_taken',
  'That code is taken.': 'code_taken',
  'Reserved for automatic contest-cheating bans.': 'ban_reason_reserved',
};
/** English refusals that carry a value (a CSV column or line); each named group becomes a parameter of the text. */
const MESSAGE_PATTERNS: ReadonlyArray<{ pattern: RegExp; code: string }> = [
  { pattern: /^Missing the (?<column>.+) column$/u, code: 'ranking_column_missing' },
  {
    pattern: /^Line (?<line>\d+) has (?<found>\d+) columns; the header has (?<expected>\d+)\.?$/u,
    code: 'ranking_row_columns',
  },
];

interface KnownIssue {
  code: string;
  params: Record<string, string>;
}

/** The SPA text key of an issue: its own code when the catalog has it, else the code its English message stands for; null when the SPA has no text. */
function knownIssueOf(issue: FieldIssue): KnownIssue | null {
  if (hasIssueText(issue.code)) return { code: issue.code, params: {} };
  for (const { pattern, code } of MESSAGE_PATTERNS) {
    const groups = pattern.exec(issue.message)?.groups;
    if (groups) return { code, params: { ...groups } };
  }
  const code = CODE_BY_MESSAGE[issue.message];
  return code ? { code, params: {} } : null;
}

/**
 * The reader's text of an issue: `admin.ui.issues.<code>` when the SPA has one; else the server's own message in the
 * English UI; else a Vietnamese line. A Vietnamese reader never sees the server's English.
 */
export function adminIssueText(issue: FieldIssue): string {
  const known = knownIssueOf(issue);
  if (known) return i18n.global.t(`admin.ui.issues.${known.code}`, known.params);
  const isEnglish = currentLocale() !== DEFAULT_LOCALE;
  return isEnglish && issue.message ? issue.message : i18n.global.t('admin.ui.issues.unmapped');
}

/** Whether the SPA has a text for this issue: its code, or the English message it stands for. */
export const isKnownIssue = (issue: FieldIssue): boolean => knownIssueOf(issue) !== null;

/** The first refusal in `error.issues` that names a reason (not just "value is off") the SPA has a text for; null when none. */
export function specificIssueText(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const issue = error.issues.find(
    (item) => !GENERIC_VALIDATOR_CODES.has(item.code) && knownIssueOf(item) !== null,
  );
  return issue ? adminIssueText(issue) : null;
}

/** Whether the SPA has a text for this backend issue code. */
export const hasIssueText = (code: string): boolean =>
  i18n.global.te(`admin.ui.issues.${code}`, DEFAULT_LOCALE);

/** Whether a refusal carries this issue code (`error.issues[].code`); the codes, not the English messages, name a refusal. */
export const hasIssueCode = (error: unknown, code: string): error is ApiError =>
  error instanceof ApiError && error.issues.some((issue) => issue.code === code);

/** An issue on field `''` (rate limit, forbidden, conflict) names no field: it is the page-line refusal, not a field error. */
const fromIssues = (issues: FieldIssue[]): FieldErrors => {
  const errors: FieldErrors = {};
  for (const issue of issues.filter((item) => item.field !== ''))
    errors[issue.field] ??= adminIssueText(issue);
  return errors;
};

const fromFields = (fields: Record<string, string[]>): FieldErrors =>
  Object.fromEntries(
    Object.entries(fields)
      .filter(([field, messages]) => field !== '' && messages.length > 0)
      .map(([field, messages]) => [
        field,
        adminIssueText({ field, code: '', message: messages[0]! }),
      ]),
  );

/** Issues carry codes (B10); some refusals (the reserved ban reason) send only `fields`. */
export function fieldErrorsOf(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  return error.issues.length > 0 ? fromIssues(error.issues) : fromFields(error.fields);
}

const isQuotaRefusal = (value: unknown): value is QuotaRefusal => {
  const details = value as Partial<QuotaRefusal> | null | undefined;
  return (
    (details?.meter === 'credits' || details?.meter === 'storage') &&
    [details.limit, details.used, details.needed].every((amount) => typeof amount === 'number')
  );
};

/** A 403 `quota_exceeded` names the meter in `details`: storage in MiB, credits as a count; null without valid details. */
export function quotaRefusalText(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.code !== 'quota_exceeded') return null;
  const details = error.extra.details;
  if (!isQuotaRefusal(details)) return null;
  const locale = currentLocale();
  const amount = (value: number) =>
    details.meter === 'storage' ? formatMebibytes(value, locale) : formatNumber(value, locale);
  const key =
    details.meter === 'storage' ? 'errors.quotaExceededStorage' : 'errors.quotaExceededCredits';
  return i18n.global.t(key, {
    needed: amount(details.needed),
    left: amount(Math.max(0, details.limit - details.used)),
    used: amount(details.used),
    limit: amount(details.limit),
  });
}

/** The wait in words: seconds under a minute, whole minutes (rounded up) under an hour, else hours and minutes. */
export function formatWait(seconds: number): string {
  if (seconds < 60) return i18n.global.t('admin.ui.duration.seconds', { count: seconds });
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return i18n.global.t('admin.ui.duration.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0
    ? i18n.global.t('admin.ui.duration.hours', { count: hours })
    : i18n.global.t('admin.ui.duration.hoursMinutes', { hours, minutes: restMinutes });
}

/** The wrapper codes that name only the kind of refusal; the issue inside says why. */
const WRAPPER_CODES: ReadonlySet<string> = new Set(['validation_failed', 'conflict', 'forbidden']);

/** A code of its own has its own text (`already_participating`); under a wrapper code the issue's reason leads. */
function refusalLineOf(error: unknown): string {
  const hasOwnCode = error instanceof ApiError && !WRAPPER_CODES.has(error.code);
  const key = errorMessageKey(error);
  if (hasOwnCode && key !== 'errors.generic') return i18n.global.t(key);
  return specificIssueText(error) ?? i18n.global.t(key);
}

/** The page-line text of a failed write: the reason an issue gives when the SPA has a text for it, else the SPA text of its code, then the wait when the server said how long (`Retry-After`). */
export function failureTextOf(error: unknown): string {
  const seconds = error instanceof ApiError ? error.retryAfterSeconds : null;
  if (seconds !== null && error instanceof ApiError && error.code === 'rate_limited')
    return i18n.global.t('admin.ui.rateLimitedWait', { wait: formatWait(seconds) });
  const text = hasIssueCode(error, 'busy')
    ? i18n.global.t('admin.ui.issues.busy')
    : (quotaRefusalText(error) ?? refusalLineOf(error));
  if (seconds === null) return text;
  return `${text} ${i18n.global.t('admin.ui.retryIn', { wait: formatWait(seconds) })}`;
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
