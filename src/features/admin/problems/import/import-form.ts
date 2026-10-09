import type { UserChip } from '@/api/types/admin-common';
import type { ImportOptions } from '@/api/types/problem-imports';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';
import { parseLanguageMap } from './import-job';

/** Backend `PROBLEM_CODE_PATTERN` (libs/database); the problem editor's copy arrives with its own task. */
export const IMPORT_CODE_PATTERN = /^[a-z0-9_]{1,32}$/;

export interface ImportForm {
  file: File | null;
  code: string;
  mode: 'create' | 'update';
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

/** Local checks only: the server's own refusals arrive as field errors after sending. */
export function importFormErrors(form: ImportForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.file) errors.file = translate('admin.polygon.form.submitNeedsFile');
  if (!IMPORT_CODE_PATTERN.test(form.code))
    errors.code = translate('admin.polygon.form.codeInvalid');
  const { invalid } = parseLanguageMap(form.languageMapText);
  if (invalid.length > 0)
    errors.statementLanguages = translate('admin.polygon.form.languageMapInvalid', {
      pairs: invalid.join(', '),
    });
  return errors;
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
