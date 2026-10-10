import { PROBLEM_CODE_PATTERN, PROBLEM_CODE_MAX } from '../problem-code';
import type { UserChip } from '@/api/types/admin-common';
import type { ImportOptions } from '@/api/types/problem-imports';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';
import { parseLanguageMap } from './import-job';

/** Backend `PROBLEM_LIMITS.points` and the `MaxLength(30)` of the two language names in `PolygonImportQueryDto`. */
export const POINTS_MIN = 800;
export const POINTS_MAX = 3500;
export const LANGUAGE_NAME_MAX = 30;

export const IMPORT_MODES = ['create', 'update'] as const;
export type ImportMode = (typeof IMPORT_MODES)[number];
/** Backend `ProblemImportsService.resolveJob`: create needs `judge.add_problem`; update needs the edit rule (`canEdit`, `edit_own_problem`). */
export const IMPORT_MODE_PERMISSION: Record<ImportMode, string> = {
  create: 'judge.add_problem',
  update: 'judge.edit_own_problem',
};

export interface ImportForm {
  file: File | null;
  code: string;
  mode: ImportMode;
  groupId: string;
  typeIds: string[];
  points: string;
  authors: UserChip[];
  curators: UserChip[];
  mainStatementLanguage: string;
  tutorialLanguage: string;
  languageMapText: string;
  ignoreZeroPointBatches: boolean;
  ignoreZeroPointCases: boolean;
  appendMainSolution: boolean;
}

/** The fields `ImportOptionsForm` renders an error under; an issue on any other field (`storage` of a quota refusal) needs the page line. */
export const IMPORT_FORM_FIELDS = [
  'file',
  'code',
  'mode',
  'groupId',
  'typeIds',
  'points',
  'authors',
  'curators',
  'mainStatementLanguage',
  'tutorialLanguage',
  'statementLanguages',
];

export const emptyImportForm = (): ImportForm => ({
  file: null,
  code: '',
  mode: 'create',
  groupId: '',
  typeIds: [],
  points: '',
  authors: [],
  curators: [],
  mainStatementLanguage: '',
  tutorialLanguage: '',
  languageMapText: '',
  ignoreZeroPointBatches: false,
  ignoreZeroPointCases: false,
  appendMainSolution: false,
});

const isPointsInRange = (text: string) => {
  if (!/^\d+$/.test(text)) return false;
  const points = Number(text);
  return points >= POINTS_MIN && points <= POINTS_MAX;
};

function fileAndCodeErrors(form: ImportForm, needsFile: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (needsFile && !form.file) errors.file = translate('admin.polygon.form.submitNeedsFile');
  if (!PROBLEM_CODE_PATTERN.test(form.code))
    errors.code = translate('admin.polygon.form.codeInvalid');
  return errors;
}

function modeAndPointsErrors(
  form: ImportForm,
  canUseMode: (mode: ImportMode) => boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!canUseMode(form.mode))
    errors.mode = translate('admin.ui.needsPermission', {
      permission: IMPORT_MODE_PERMISSION[form.mode],
    });
  const points = form.points.trim();
  if (points && !isPointsInRange(points))
    errors.points = translate('admin.polygon.form.pointsRange', {
      min: POINTS_MIN,
      max: POINTS_MAX,
    });
  return errors;
}

const isTooLong = (text: string) => text.trim().length > LANGUAGE_NAME_MAX;

function languageErrors(form: ImportForm): FieldErrors {
  const errors: FieldErrors = {};
  const tooLong = translate('admin.polygon.form.languageTooLong', { max: LANGUAGE_NAME_MAX });
  if (isTooLong(form.mainStatementLanguage)) errors.mainStatementLanguage = tooLong;
  if (isTooLong(form.tutorialLanguage)) errors.tutorialLanguage = tooLong;
  const { invalid } = parseLanguageMap(form.languageMapText);
  if (invalid.length > 0)
    errors.statementLanguages = translate('admin.polygon.form.languageMapInvalid', {
      pairs: invalid.join(', '),
    });
  return errors;
}

/**
 * Local checks, the same ones the backend DTO and the permission check make; the server's own refusals arrive as field
 * errors. An import from Polygon has no file (`needsFile: false`).
 */
export function importFormErrors(
  form: ImportForm,
  canUseMode: (mode: ImportMode) => boolean,
  { needsFile = true }: { needsFile?: boolean } = {},
): FieldErrors {
  return {
    ...fileAndCodeErrors(form, needsFile),
    ...modeAndPointsErrors(form, canUseMode),
    ...languageErrors(form),
  };
}

const optionalText = (text: string) => text.trim() || undefined;

/** Options as the query string takes them: an empty choice is left out, not sent as an empty value. */
export function toImportOptions(form: ImportForm): ImportOptions {
  return {
    code: form.code,
    mode: form.mode,
    authors: form.authors.map((chip) => chip.id),
    curators: form.curators.map((chip) => chip.id),
    groupId: form.groupId || undefined,
    typeIds: form.typeIds,
    points: form.points.trim() ? Number(form.points) : undefined,
    mainStatementLanguage: optionalText(form.mainStatementLanguage),
    statementLanguages: parseLanguageMap(form.languageMapText).pairs,
    tutorialLanguage: optionalText(form.tutorialLanguage),
    ignoreZeroPointBatches: form.ignoreZeroPointBatches,
    ignoreZeroPointCases: form.ignoreZeroPointCases,
    appendMainSolution: form.appendMainSolution,
  };
}

/** A Polygon short name as a problem code (`xau-doi-xung` -> `xau_doi_xung`); empty when nothing usable is left. */
export function codeFromPolygonName(name: string): string {
  const code = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, PROBLEM_CODE_MAX);
  return PROBLEM_CODE_PATTERN.test(code) ? code : '';
}
