import type { Language } from '@/api/types/problems';
import type { RejudgeBody } from '@/api/types/submission-actions';
import type { SubmissionResult } from '@/api/types/submissions';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';
import { shortId } from '../ui/short-id';

export const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_REJUDGE_LANGUAGES = 50;

export interface RejudgeFilter {
  problem: string;
  idFrom: string;
  idTo: string;
  languageIds: string[];
  results: SubmissionResult[];
  force: boolean;
}

export const emptyRejudgeFilter = (): RejudgeFilter => ({
  problem: '',
  idFrom: '',
  idTo: '',
  languageIds: [],
  results: [],
  force: false,
});

export function checkRejudgeFilter(filter: RejudgeFilter): FieldErrors {
  const errors: FieldErrors = {};
  if (!filter.problem.trim()) errors.problem = translate('admin.rejudge.errors.problem');
  for (const field of ['idFrom', 'idTo'] as const)
    if (filter[field].trim() && !UUID_V7.test(filter[field].trim()))
      errors[field] = translate('admin.rejudge.errors.id');
  if (filter.languageIds.length > MAX_REJUDGE_LANGUAGES)
    errors.languages = translate('admin.rejudge.errors.languages');
  return errors;
}

/** The request body for the filter: empty parts are left out, `force` only when it is on. */
export function toRejudgeBody(filter: RejudgeFilter): RejudgeBody {
  const body: RejudgeBody = { problem: filter.problem.trim() };
  if (filter.idFrom.trim()) body.idFrom = filter.idFrom.trim();
  if (filter.idTo.trim()) body.idTo = filter.idTo.trim();
  if (filter.languageIds.length > 0) body.languages = filter.languageIds;
  if (filter.results.length > 0) body.results = filter.results;
  if (filter.force) body.force = true;
  return body;
}

export interface RejudgeFilterText {
  problem: string;
  from: string;
  to: string;
  languages: string;
  results: string;
  locked: string;
}

/** The filter as the words the summary and the confirm show: empty parts say what they mean (all, no limit). */
export function describeRejudgeFilter(
  filter: RejudgeFilter,
  languages: Language[],
): RejudgeFilterText {
  const languageNames = languages
    .filter((language) => filter.languageIds.includes(language.id))
    .map((language) => language.name);
  return {
    problem: filter.problem.trim(),
    from: filter.idFrom.trim()
      ? shortId(filter.idFrom.trim())
      : translate('admin.rejudge.summary.noLimit'),
    to: filter.idTo.trim()
      ? shortId(filter.idTo.trim())
      : translate('admin.rejudge.summary.noLimit'),
    languages:
      languageNames.length > 0
        ? languageNames.join(', ')
        : translate('admin.rejudge.summary.allLanguages'),
    results:
      filter.results.length > 0
        ? filter.results.join(', ')
        : translate('admin.rejudge.summary.allResults'),
    locked: translate(
      filter.force ? 'admin.rejudge.summary.lockedRejudge' : 'admin.rejudge.summary.lockedSkip',
    ),
  };
}
