import type { ApiError } from '@/api/client';
import type { QuotaRefusal } from '@/api/types/organization-usage';
import { DEFAULT_LOCALE, i18n, isLocale, translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { formatNumber } from '@/lib/format';
import { formatMebibytes } from '@/lib/quota';
import { formatWait } from './format-wait';

/** What the reader knows about one error-level code beyond `errors.<code>` and `admin.ui.issues.<code>`. */
export interface CodeEntry {
  /** The reader's text for this refusal (quota numbers, Polygon language names, the wait). */
  readonly text: (refusal: ApiError) => string;
  /** The form field this refusal belongs under, from its `extra.params`; null or omitted = the page line. */
  readonly fieldOf?: (refusal: ApiError) => string | null;
}

type Params = Record<string, unknown>;

/** A param as text: a list joined, a string or number as it is; anything else (absent, malformed) as empty. */
const textOf = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(textOf).join(', ');
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

const paramsOf = (refusal: ApiError): Params => {
  const params = refusal.extra.params;
  return params && typeof params === 'object' ? (params as Params) : {};
};

const currentLocale = (): Locale => {
  const locale = i18n.global.locale.value;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
};

/** The codes of a refused Polygon import's options (the server finds them before queueing). */
export const POLYGON_OPTION_CODES = [
  'statement_language_required',
  'statement_language_unmapped',
  'statement_language_repeated',
  'tutorial_language_required',
  'too_many_testcases',
] as const;

/**
 * The field of `PolygonLanguageFields` a refusal of the options belongs under (`main`, `tutorial`, `others`,
 * `other:<language>`), or null for the page line. Also reads a job's last failure, which has a code and params but no ApiError.
 */
export function optionsFieldOf(code: string, params: Params): string | null {
  switch (code) {
    case 'statement_language_required':
      return 'main';
    case 'statement_language_unmapped':
      return `other:${textOf(params.language)}`;
    case 'statement_language_repeated':
      return 'others';
    case 'tutorial_language_required':
      return 'tutorial';
    default:
      return null;
  }
}

const isQuotaRefusal = (value: unknown): value is QuotaRefusal => {
  const details = value as Partial<QuotaRefusal> | null | undefined;
  return (
    (details?.meter === 'credits' || details?.meter === 'storage') &&
    [details.limit, details.used, details.needed].every((amount) => typeof amount === 'number')
  );
};

/** A 403 `quota_exceeded` names the meter in `details`: storage in MiB, credits as a count; the generic text without valid details. */
function quotaText(refusal: ApiError): string {
  const details = refusal.extra.details;
  if (!isQuotaRefusal(details)) return translate(errorMessageKey(refusal));
  const locale = currentLocale();
  const amount = (value: number) =>
    details.meter === 'storage' ? formatMebibytes(value, locale) : formatNumber(value, locale);
  const key =
    details.meter === 'storage' ? 'errors.quotaExceededStorage' : 'errors.quotaExceededCredits';
  return translate(key, {
    needed: amount(details.needed),
    left: amount(Math.max(0, details.limit - details.used)),
    used: amount(details.used),
    limit: amount(details.limit),
  });
}

/** The rate limit's text, with the wait when the server said how long. */
const rateLimitedText = (refusal: ApiError): string =>
  refusal.retryAfterSeconds === null
    ? translate(errorMessageKey(refusal))
    : translate('admin.ui.rateLimitedWait', { wait: formatWait(refusal.retryAfterSeconds) });

const optionEntry: CodeEntry = {
  text: (refusal) =>
    translate(`admin.polygonLink.configure.refusal.${refusal.code}`, {
      languages: textOf(paramsOf(refusal).languages),
      language: textOf(paramsOf(refusal).language),
      count: textOf(paramsOf(refusal).count),
      limit: textOf(paramsOf(refusal).limit),
    }),
  fieldOf: (refusal) => optionsFieldOf(refusal.code, paramsOf(refusal)),
};

export const CODE_ENTRIES: Readonly<Record<string, CodeEntry>> = {
  quota_exceeded: { text: quotaText },
  rate_limited: { text: rateLimitedText },
  ...Object.fromEntries(POLYGON_OPTION_CODES.map((code) => [code, optionEntry])),
};

/** The import pages' wording of the shared hourly limit (`admin.polygon.rateLimited`); passed as `catalog` by them. */
export const IMPORT_REFUSALS: Readonly<Record<string, CodeEntry>> = {
  rate_limited: {
    text: (refusal) =>
      refusal.retryAfterSeconds === null
        ? translate('admin.polygon.rateLimited')
        : `${translate('admin.polygon.rateLimited')} ${translate('admin.ui.retryIn', { wait: formatWait(refusal.retryAfterSeconds) })}`,
  },
};
