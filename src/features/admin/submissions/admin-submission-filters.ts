import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { RejudgeBody } from '@/api/types/submission-actions';
import type {
  SubmissionListQuery,
  SubmissionResult,
  SubmissionStatus,
} from '@/api/types/submissions';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';

export const ADMIN_SUBMISSION_PAGE_SIZE = 50;
/** The judging states staff filter by (the admin changelist's QU/P/G filter plus the finished ones). */
export const STAFF_STATUSES: readonly SubmissionStatus[] = [
  'QU',
  'P',
  'G',
  'D',
  'IE',
  'CE',
  'AB',
  'PD',
];

/** The list filter, all of it in the URL so a link (the rejudge outcome, the queue card) opens it filtered. */
export interface AdminSubmissionFilters {
  problem: string;
  user: string;
  languages: string[];
  results: SubmissionResult[];
  statuses: SubmissionStatus[];
  page: number;
}

const listOf = (value: LocationQuery[string] | undefined): string[] =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string' && item !== '',
  );
const textOf = (value: LocationQuery[string] | undefined) =>
  typeof value === 'string' ? value.trim() : '';
const known = <Code extends string>(codes: readonly Code[], values: string[]): Code[] =>
  values.filter((value): value is Code => (codes as readonly string[]).includes(value));

/** Unknown codes and malformed pages are dropped, so a hand-edited URL cannot send a request the API refuses. */
export function filtersFromQuery(query: LocationQuery): AdminSubmissionFilters {
  const page = Number(textOf(query.page));
  return {
    problem: textOf(query.problem),
    user: textOf(query.user),
    languages: listOf(query.language),
    results: known(SUBMISSION_RESULT_CODES, listOf(query.result)),
    statuses: known(STAFF_STATUSES, listOf(query.status)),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The URL for a filter: empty parts are left out, page 1 is the default. */
export function queryOfFilters(filters: AdminSubmissionFilters): LocationQueryRaw {
  return {
    ...(filters.problem && { problem: filters.problem }),
    ...(filters.user && { user: filters.user }),
    ...(filters.languages.length && { language: filters.languages }),
    ...(filters.results.length && { result: filters.results }),
    ...(filters.statuses.length && { status: filters.statuses }),
    ...(filters.page > 1 && { page: String(filters.page) }),
  };
}

export const listQueryOf = (filters: AdminSubmissionFilters): SubmissionListQuery => ({
  problem: filters.problem || undefined,
  user: filters.user || undefined,
  language: filters.languages.length ? filters.languages : undefined,
  result: filters.results.length ? filters.results : undefined,
  status: filters.statuses.length ? filters.statuses : undefined,
  page: filters.page,
  pageSize: ADMIN_SUBMISSION_PAGE_SIZE,
});

/**
 * What a bulk action sends. A selection sends its ids (with the problem filter, so a problem editor's batch stays in their
 * scope); "every match" sends the filter itself. The status filter has no batch equivalent: rejudges skip running rows anyway.
 */
export function batchBodyOf(
  filters: AdminSubmissionFilters,
  selection: { ids: string[]; allMatching: boolean },
): RejudgeBody {
  const scope: RejudgeBody = filters.problem ? { problem: filters.problem } : {};
  if (!selection.allMatching) return { ...scope, ids: selection.ids };
  return {
    ...scope,
    ...(filters.user && { user: filters.user }),
    ...(filters.languages.length && { languages: filters.languages }),
    ...(filters.results.length && { results: filters.results }),
  };
}

/** The batch fields the admin list can filter on too; `force` does not narrow which rows wait. */
const LISTABLE_BATCH_FIELDS = new Set(['problem', 'user', 'force']);

/**
 * The admin list filtered to the queued rows of a rejudge's scope: where staff watch it drain. `undefined` when the batch
 * was narrowed by something the list cannot filter on (contest, judge, dates, ids, verdicts), since the link would then
 * count the whole scope's queue as the batch's.
 */
export function queuedLinkQuery(body: RejudgeBody): Record<string, string> | undefined {
  if (Object.keys(body).some((field) => !LISTABLE_BATCH_FIELDS.has(field))) return undefined;
  return {
    status: 'QU',
    ...(body.problem && { problem: body.problem }),
    ...(body.user && { user: body.user }),
  };
}
