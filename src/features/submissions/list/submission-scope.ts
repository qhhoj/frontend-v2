import type { Page } from '@/api/client';
import { fetchContestSubmissions } from '@/api/contests.api';
import { fetchOrganizationSubmissions } from '@/api/organizations.api';
import { fetchSubmissions } from '@/api/submissions.api';
import type { SubmissionListItem, SubmissionListQuery } from '@/api/types/submissions';
import { STATUS_GROUP_STATUSES } from '../use-submission-filters';
import type { SubmissionFilters } from '../use-submission-filters';

export const SUBMISSION_PAGE_SIZE = 50;

/**
 * Which submissions a list shows: the whole site, one organization's members, or one contest. All three endpoints take
 * the same query and answer the same page, so a scope only picks the endpoint, its cache key and the fixed filters.
 */
export type SubmissionScope =
  | { kind: 'global' }
  | { kind: 'organization'; slug: string }
  /** `fixedUser` narrows the list to one user whatever the URL says (the contestant's own-only list). */
  | { kind: 'contest'; key: string; fixedUser: string | null };

/** The judging-state boxes as the statuses they stand for, in box order (`undefined` when no box is ticked). */
const statusesOf = (filters: SubmissionFilters) =>
  filters.statusGroups.length
    ? filters.statusGroups.flatMap((group) => STATUS_GROUP_STATUSES[group])
    : undefined;

/** The user the scope pins, if any: it wins over the URL's `user`. */
export const fixedUserOf = (scope: SubmissionScope): string | null =>
  scope.kind === 'contest' ? scope.fixedUser : null;

/** The list filters as the API takes them (`live` is a view setting and stays out). */
export const scopeApiQuery = (
  scope: SubmissionScope,
  filters: SubmissionFilters,
): SubmissionListQuery => ({
  problem: filters.problem || undefined,
  user: fixedUserOf(scope) ?? (filters.user || undefined),
  result: filters.results.length ? filters.results : undefined,
  language: filters.languageIds.length ? filters.languageIds : undefined,
  status: statusesOf(filters),
  page: filters.page,
  pageSize: SUBMISSION_PAGE_SIZE,
});

/**
 * One cache entry per scope, viewer and query (what a viewer may see depends on who asks). The global key shares the
 * `['submissions', 'list']` prefix with Home's recent submissions, so a finished submission refreshes both.
 */
export const scopeQueryKey = (
  scope: SubmissionScope,
  viewerId: string,
  apiQuery: SubmissionListQuery,
): readonly unknown[] => {
  switch (scope.kind) {
    case 'global':
      return ['submissions', 'list', viewerId, apiQuery];
    case 'organization':
      return ['submissions', 'organization', viewerId, scope.slug, apiQuery];
    case 'contest':
      return ['submissions', 'contest', viewerId, scope.key, apiQuery];
  }
};

/** One page of the scope's list. */
export const fetchScopePage = (
  scope: SubmissionScope,
  query: SubmissionListQuery,
): Promise<Page<SubmissionListItem>> => {
  switch (scope.kind) {
    case 'global':
      return fetchSubmissions(query);
    case 'organization':
      return fetchOrganizationSubmissions(scope.slug, query);
    case 'contest':
      return fetchContestSubmissions(scope.key, query);
  }
};

/**
 * Whether the previous list may stay on screen while `nextKey` loads: only the same scope and viewer, and in a contest
 * only the same user, so a switch to the own-only list never shows the all-users rows.
 */
export const keepsPreviousRows = (
  previousKey: readonly unknown[] | undefined,
  nextKey: readonly unknown[],
): boolean => {
  if (!previousKey || previousKey.length !== nextKey.length) return false;
  const sameScope = previousKey.slice(0, -1).every((part, index) => part === nextKey[index]);
  if (!sameScope) return false;
  const userOf = (key: readonly unknown[]) => (key.at(-1) as SubmissionListQuery).user;
  return nextKey[1] !== 'contest' || userOf(previousKey) === userOf(nextKey);
};

/** The whole site's list (the problem page's own-submission panels read it narrowed to the viewer). */
export const GLOBAL_SCOPE: SubmissionScope = { kind: 'global' };
