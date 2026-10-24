import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import { DEFAULT_LOCALE, i18n, translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { formatWait } from './format-wait';
import { CODE_ENTRIES, currentLocale } from './refusal-catalog';
import type { CodeEntry } from './refusal-catalog';

export type FieldErrors = Record<string, string>;

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
  return unmappedMessageText(issue.message);
}

/**
 * The text of a server message the SPA has no code for: a message already in Vietnamese (it has non-ASCII letters) as it
 * is; an English one in the English UI as it is; any other English one a Vietnamese line.
 */
export function unmappedMessageText(message: string): string {
  const code = CODE_BY_MESSAGE[message];
  if (code) return i18n.global.t(`admin.ui.issues.${code}`);
  const isVietnamese = /[^\x00-\x7F]/u.test(message);
  const isEnglishUi = currentLocale() !== DEFAULT_LOCALE;
  return isVietnamese || (isEnglishUi && message)
    ? message
    : i18n.global.t('admin.ui.issues.unmapped');
}

/** Whether the SPA has a text for this issue: its code, or the English message it stands for. */
export const isKnownIssue = (issue: FieldIssue): boolean => knownIssueOf(issue) !== null;

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

/** Issues carry codes; some refusals (the reserved ban reason) send only `fields`. */
export function fieldErrorsOf(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  return error.issues.length > 0 ? fromIssues(error.issues) : fromFields(error.fields);
}

export { formatWait };

/** The fields a form shows a text under. */
export interface RenderedFields {
  /** Error keys the form reads, e.g. `name` or `cases.*.input` (`*` = exactly one path segment). */
  readonly paths: readonly string[];
  /** Server path → rendered path, for a field the form names differently: `{ 'users.*.username': 'username' }`. */
  readonly aliases?: Readonly<Record<string, string>>;
}

export interface ReadOptions extends Partial<RenderedFields> {
  /** Entries consulted before the shared catalog (the import pages' wording of `rate_limited`). */
  readonly catalog?: Readonly<Record<string, CodeEntry>>;
}

/** A refusal as the page shows it. */
export interface Refusal {
  /** One text per rendered path the refusal names. Only rendered paths appear. */
  readonly fields: FieldErrors;
  /** Every reason that reached no rendered field, as one line; null when the field texts already say everything. */
  readonly line: string | null;
}

/** One thing a refusal says: an issue, a `fields` entry, or an options refusal that names its field. */
interface Reason {
  readonly path: string;
  /** The text under a field. */
  readonly text: string;
  /** The text in the page line; null when the reason is generic or the SPA has no text for it (the wrapper text stands in). */
  readonly specific: string | null;
}

/** The wrapper codes that name only the kind of refusal; the issue inside says why. */
const WRAPPER_CODES: ReadonlySet<string> = new Set(['validation_failed', 'conflict', 'forbidden']);

const segmentsMatch = (pattern: string, path: string): boolean => {
  const want = pattern.split('.');
  const have = path.split('.');
  return (
    want.length === have.length && want.every((part, index) => part === '*' || part === have[index])
  );
};

/** The rendered path a server path lands on: an alias, else the longest prefix (the path itself first) a rendered path matches; null when none. */
function routeOf(path: string, rendered: RenderedFields): string | null {
  if (path === '') return null;
  for (const [pattern, target] of Object.entries(rendered.aliases ?? {}))
    if (segmentsMatch(pattern, path)) return target;
  const segments = path.split('.');
  for (let length = segments.length; length > 0; length -= 1) {
    const prefix = segments.slice(0, length).join('.');
    if (rendered.paths.some((pattern) => segmentsMatch(pattern, prefix))) return prefix;
  }
  return null;
}

function reasonOfIssue(issue: FieldIssue, error: ApiError, entry: CodeEntry | undefined): Reason {
  if (entry && issue.code === error.code) {
    const text = entry.text(error);
    return { path: issue.field, text, specific: text };
  }
  const text = adminIssueText(issue);
  const isSpecific = !GENERIC_VALIDATOR_CODES.has(issue.code) && knownIssueOf(issue) !== null;
  return { path: issue.field, text, specific: isSpecific ? text : null };
}

/** `issues[]`; the `fields` map when there are none (the reserved ban reason); the field an options refusal names. */
function reasonsOf(error: ApiError, entry: CodeEntry | undefined): Reason[] {
  const reasons =
    error.issues.length > 0
      ? error.issues.map((issue) => reasonOfIssue(issue, error, entry))
      : Object.entries(error.fields)
          .filter(([, messages]) => messages.length > 0)
          .map(([field, messages]) =>
            reasonOfIssue({ field, code: '', message: messages[0]! }, error, entry),
          );
  const optionField = entry?.fieldOf?.(error) ?? null;
  if (optionField !== null && entry)
    reasons.push({ path: optionField, text: entry.text(error), specific: entry.text(error) });
  return reasons;
}

/** The line of a wrapper (or unknown) code: each unrouted reason's specific text once, then the code's own text when a reason has none. */
function wrapperLineOf(error: ApiError, unrouted: readonly Reason[]): string {
  const parts = new Set(unrouted.flatMap((reason) => (reason.specific ? [reason.specific] : [])));
  const needsWrapper = unrouted.length === 0 || unrouted.some((reason) => !reason.specific);
  if (needsWrapper) parts.add(translate(errorMessageKey(error)));
  return [...parts].join(' ');
}

function unroutedLineOf(error: ApiError, unrouted: readonly Reason[], entry?: CodeEntry): string {
  if (entry) return entry.text(error);
  if (error.issues.some((issue) => issue.code === 'busy')) return translate('admin.ui.issues.busy');
  const key = errorMessageKey(error);
  if (!WRAPPER_CODES.has(error.code) && key !== 'errors.generic') return translate(key);
  return wrapperLineOf(error, unrouted);
}

/**
 * The one reader of a refusal. Any `unknown` is accepted: a non-ApiError reads as the generic line.
 * A reason that reaches a rendered field becomes that field's text; every other reason goes to the line.
 */
export function readRefusal(error: unknown, options: ReadOptions = {}): Refusal {
  if (!(error instanceof ApiError)) return { fields: {}, line: translate('errors.generic') };
  const rendered: RenderedFields = { paths: options.paths ?? [], aliases: options.aliases };
  const entry = options.catalog?.[error.code] ?? CODE_ENTRIES[error.code];
  const reasons = reasonsOf(error, entry);
  const fields: FieldErrors = {};
  const unrouted: Reason[] = [];
  for (const reason of reasons) {
    const path = routeOf(reason.path, rendered);
    if (path === null) unrouted.push(reason);
    else fields[path] ??= reason.text;
  }
  if (reasons.length > 0 && unrouted.length === 0) return { fields, line: null };
  const seconds = error.retryAfterSeconds;
  const line = unroutedLineOf(error, unrouted, entry);
  const wait =
    seconds !== null && error.code !== 'rate_limited'
      ? ` ${translate('admin.ui.retryIn', { wait: formatWait(seconds) })}`
      : '';
  return { fields, line: line + wait };
}

/** `readRefusal(error).line` for callers that render no field. Never null for a failure. */
export const failureTextOf = (error: unknown): string =>
  readRefusal(error).line ?? translate('errors.generic');

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
