import type { Schemas } from '@/api/schemas';
import { DEFAULT_LOCALE, i18n, translate } from '@/i18n';

export type ImportErrorCode = Schemas['PolygonImportErrorCode'];
type Param = string | number | string[];
export type ImportErrorParams = Record<string, Param> | null;

/**
 * What a failure asks of the setter, which picks its one action: `options` (the languages or the test count: edit the
 * import's options), `target` (the problem code: edit the target), `transient` (try again later), `attention` (imported,
 * a sync repairs the files), `other` (fix the package on Polygon, or ask an administrator).
 */
export type ImportErrorKind = 'options' | 'target' | 'transient' | 'attention' | 'other';

export interface ImportErrorText {
  kind: ImportErrorKind;
  /** The cause, one line. */
  title: string;
  /** What to do about it. */
  fix: string;
}

const KINDS: Partial<Record<ImportErrorCode, ImportErrorKind>> = {
  statement_language_required: 'options',
  statement_language_unmapped: 'options',
  statement_language_repeated: 'options',
  tutorial_language_required: 'options',
  too_many_testcases: 'options',
  problem_code_taken: 'target',
  problem_not_found: 'target',
  problem_not_importable: 'target',
  polygon_already_linked: 'target',
  // Backend `RETRYABLE_IMPORT_ERRORS`: a job says so itself (`retryable`), a link's last sync does not.
  polygon_unavailable: 'transient',
  generation_no_judge: 'transient',
  problem_changed: 'transient',
  imported_needs_attention: 'attention',
};

/** A param as text: a list joined, a string or number as it is; anything else (absent, malformed) as empty. */
const textOf = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(textOf).join(', ');
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

const paramTexts = (params: ImportErrorParams) =>
  Object.fromEntries(Object.entries(params ?? {}).map(([name, value]) => [name, textOf(value)]));

/** Codes a newer backend may add are shown as an unknown failure until they get their own text. */
const isKnown = (code: string) =>
  i18n.global.te(`admin.polygonErrors.${code}.title`, DEFAULT_LOCALE);

/** The failure of an import or sync as the setter reads it: its translated cause and fix, and what kind of action helps. */
export function importErrorOf(
  code: ImportErrorCode | null,
  params: ImportErrorParams,
): ImportErrorText {
  const key = code && isKnown(code) ? code : 'unknown';
  const texts = paramTexts(params);
  return {
    kind: (code && KINDS[code]) ?? 'other',
    title: translate(`admin.polygonErrors.${key}.title`, texts),
    fix: translate(`admin.polygonErrors.${key}.fix`, texts),
  };
}
