import { ApiError } from '@/api/client';
import { translate } from '@/i18n';

/**
 * A refusal of the import's options that the server finds before queueing (400, `params` as a job's `errorParams`):
 * the field of `PolygonLanguageFields` it belongs under (`main`, `tutorial`, `others`, `other:<language>`), or null for
 * the page line.
 */
export interface OptionsRefusal {
  field: string | null;
  text: string;
}

const OPTION_CODES = new Set([
  'statement_language_required',
  'statement_language_unmapped',
  'statement_language_repeated',
  'tutorial_language_required',
  'too_many_testcases',
]);

type Params = Record<string, unknown>;
const paramsOf = (error: ApiError): Params => {
  const params = error.extra.params;
  return params && typeof params === 'object' ? (params as Params) : {};
};
/** A param as text: a list joined, a string or number as it is; anything else (absent, malformed) as empty. */
const textOf = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(textOf).join(', ');
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

/** The language field a refusal (or a sync failure) with this code and params belongs under; null for the page line. */
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

/** The refusal as the configure step shows it, or null when the failure is not about the options. */
export function optionsRefusalOf(error: unknown): OptionsRefusal | null {
  if (!(error instanceof ApiError) || !OPTION_CODES.has(error.code)) return null;
  const params = paramsOf(error);
  const text = translate(`admin.polygonLink.configure.refusal.${error.code}`, {
    languages: textOf(params.languages),
    language: textOf(params.language),
    count: textOf(params.count),
    limit: textOf(params.limit),
  });
  return { field: optionsFieldOf(error.code, params), text };
}
