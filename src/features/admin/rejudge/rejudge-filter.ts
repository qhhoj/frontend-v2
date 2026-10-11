import type { Language } from '@/api/types/problems';
import type { RejudgeBody, RescoreBody } from '@/api/types/submission-actions';
import type { SubmissionResult } from '@/api/types/submissions';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';
import { fromLocalInput } from '../ui/datetime';
import { shortId } from '../ui/short-id';

export const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_REJUDGE_LANGUAGES = 50;

/** Text fields the URL may prefill (`/admin/rejudge?contest=…&problem=…`). */
export const LINKABLE_FIELDS = ['problem', 'contest', 'user', 'judgedOn'] as const;
type LinkableField = (typeof LINKABLE_FIELDS)[number];

export interface RejudgeFilter extends Record<LinkableField, string> {
  /** `datetime-local` values in the viewer's zone. */
  dateFrom: string;
  dateTo: string;
  idFrom: string;
  idTo: string;
  languageIds: string[];
  results: SubmissionResult[];
  force: boolean;
}

export const emptyRejudgeFilter = (): RejudgeFilter => ({
  problem: '',
  contest: '',
  user: '',
  judgedOn: '',
  dateFrom: '',
  dateTo: '',
  idFrom: '',
  idTo: '',
  languageIds: [],
  results: [],
  force: false,
});

/** One-click verdict sets for the usual cleanups after a judge or compiler fix. */
export const RESULT_PRESETS = {
  internalErrors: ['IE'],
  compileErrors: ['CE'],
  notAccepted: SUBMISSION_RESULT_CODES.filter((code) => code !== 'AC'),
} as const satisfies Record<string, readonly SubmissionResult[]>;
export type ResultPreset = keyof typeof RESULT_PRESETS;

/** Neither a problem nor a contest: the batch reaches every problem (needs `judge.edit_all_problem`). */
export const isSiteWide = (filter: RejudgeFilter) =>
  !filter.problem.trim() && !filter.contest.trim();

export function checkRejudgeFilter(filter: RejudgeFilter): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ['idFrom', 'idTo'] as const)
    if (filter[field].trim() && !UUID_V7.test(filter[field].trim()))
      errors[field] = translate('admin.rejudge.errors.id');
  const from = fromLocalInput(filter.dateFrom);
  const to = fromLocalInput(filter.dateTo);
  if (from && to && from >= to) errors.dateTo = translate('admin.rejudge.errors.dateOrder');
  if (filter.languageIds.length > MAX_REJUDGE_LANGUAGES)
    errors.languages = translate('admin.rejudge.errors.languages');
  return errors;
}

/** The request body for the filter: empty parts are left out, `force` only when it is on. */
export function toRejudgeBody(filter: RejudgeFilter): RejudgeBody {
  const body: RejudgeBody = {};
  for (const field of [...LINKABLE_FIELDS, 'idFrom', 'idTo'] as const) {
    const value = filter[field].trim();
    if (value) body[field] = value;
  }
  const dateFrom = fromLocalInput(filter.dateFrom);
  const dateTo = fromLocalInput(filter.dateTo);
  if (dateFrom) body.dateFrom = dateFrom;
  if (dateTo) body.dateTo = dateTo;
  if (filter.languageIds.length > 0) body.languages = filter.languageIds;
  if (filter.results.length > 0) body.results = filter.results;
  if (filter.force) body.force = true;
  return body;
}

/** A rescore takes the same filter; locks do not matter to it. */
export function toRescoreBody(body: RejudgeBody): RescoreBody {
  const rescore: RejudgeBody = { ...body };
  delete rescore.force;
  return rescore;
}

/** The filter the URL names: only the linkable text fields, unknown keys ignored. */
export function filterFromQuery(query: Record<string, unknown>): RejudgeFilter {
  const filter = emptyRejudgeFilter();
  for (const field of LINKABLE_FIELDS)
    if (typeof query[field] === 'string') filter[field] = query[field];
  return filter;
}

export interface RejudgeFilterText {
  scope: string;
  user: string;
  judge: string;
  from: string;
  to: string;
  languages: string;
  results: string;
  locked: string;
}

const orAll = (value: string, allKey: string) =>
  value ? value : translate(`admin.rejudge.summary.${allKey}`);

/** Where the batch reaches, in words: contest and problem, one of them, or the whole site. */
function scopeText(filter: RejudgeFilter): string {
  const problem = filter.problem.trim();
  const contest = filter.contest.trim();
  if (contest && problem)
    return translate('admin.rejudge.summary.contestProblem', { contest, problem });
  if (contest) return translate('admin.rejudge.summary.contestOnly', { contest });
  return problem || translate('admin.rejudge.summary.siteWide');
}

/** The lower or upper bound: the date and the id when both are set (the server applies both), else whichever is. */
function boundText(date: string, id: string): string {
  const parts = [date.replace('T', ' '), id.trim() && shortId(id.trim())].filter(Boolean);
  return parts.join(' · ') || translate('admin.rejudge.summary.noLimit');
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
    scope: scopeText(filter),
    user: orAll(filter.user.trim(), 'allUsers'),
    judge: orAll(filter.judgedOn.trim(), 'allJudges'),
    from: boundText(filter.dateFrom, filter.idFrom),
    to: boundText(filter.dateTo, filter.idTo),
    languages: orAll(languageNames.join(', '), 'allLanguages'),
    results: orAll(filter.results.join(', '), 'allResults'),
    locked: translate(
      filter.force ? 'admin.rejudge.summary.lockedRejudge' : 'admin.rejudge.summary.lockedSkip',
    ),
  };
}
