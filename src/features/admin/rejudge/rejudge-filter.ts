import type { Language } from '@/api/types/problems';
import type { RejudgeBody, RescoreBody } from '@/api/types/submission-actions';
import type { SubmissionResult } from '@/api/types/submissions';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';
import { formatInZone } from '../ui/form/site-time';

export const MAX_REJUDGE_LANGUAGES = 50;

/** Text fields the URL may prefill (`/admin/rejudge?contest=…&problem=…`). */
export const LINKABLE_FIELDS = ['problem', 'contest', 'user', 'judgedOn'] as const;
type LinkableField = (typeof LINKABLE_FIELDS)[number];

export interface RejudgeFilter extends Record<LinkableField, string> {
  /** ISO instants (`AdminDateTimeField`, typed in the site's zone), or null for no bound. */
  dateFrom: string | null;
  dateTo: string | null;
  languageIds: string[];
  results: SubmissionResult[];
  force: boolean;
}

export const emptyRejudgeFilter = (): RejudgeFilter => ({
  problem: '',
  contest: '',
  user: '',
  judgedOn: '',
  dateFrom: null,
  dateTo: null,
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

/** Neither a problem nor a contest: the batch reaches every problem (needs the "edit every problem" permission). */
export const isSiteWide = (filter: RejudgeFilter) =>
  !filter.problem.trim() && !filter.contest.trim();

export function checkRejudgeFilter(filter: RejudgeFilter): FieldErrors {
  const errors: FieldErrors = {};
  const { dateFrom: from, dateTo: to } = filter;
  if (from && to && Date.parse(from) >= Date.parse(to))
    errors.dateTo = translate('admin.rejudge.errors.dateOrder');
  if (filter.languageIds.length > MAX_REJUDGE_LANGUAGES)
    errors.languages = translate('admin.rejudge.errors.languages');
  return errors;
}

/** The request body for the filter: empty parts are left out, `force` only when it is on. */
export function toRejudgeBody(filter: RejudgeFilter): RejudgeBody {
  const body: RejudgeBody = {};
  for (const field of LINKABLE_FIELDS) {
    const value = filter[field].trim();
    if (value) body[field] = value;
  }
  if (filter.dateFrom) body.dateFrom = filter.dateFrom;
  if (filter.dateTo) body.dateTo = filter.dateTo;
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

/** The lower or upper date bound, or "no limit". */
const boundText = (date: string | null): string =>
  date ? formatInZone(date) : translate('admin.rejudge.summary.noLimit');

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
    from: boundText(filter.dateFrom),
    to: boundText(filter.dateTo),
    languages: orAll(languageNames.join(', '), 'allLanguages'),
    results: orAll(filter.results.join(', '), 'allResults'),
    locked: translate(
      filter.force ? 'admin.rejudge.summary.lockedRejudge' : 'admin.rejudge.summary.lockedSkip',
    ),
  };
}
