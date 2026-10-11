import type { LocationQuery } from 'vue-router';
import type { AdminCommentQuery } from '@/api/comments.api';
import { COMMENT_PAGE_TYPES } from '@/api/types/comments';
import type { AdminCommentState, CommentPageType } from '@/api/types/comments';
import { pageFromQuery } from '@/lib/paging';

export const COMMENT_STATES = [
  'all',
  'visible',
  'hidden',
] as const satisfies readonly AdminCommentState[];

/** The filter form's state; empty strings are "any". */
export interface CommentFilters {
  search: string;
  author: string;
  state: AdminCommentState;
  pageType: CommentPageType | '';
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const oneOf = <Value extends string>(
  options: readonly Value[],
  value: unknown,
): Value | undefined => options.find((option) => option === value);

/** The filters live in the URL, so a search can be shared and the back button undoes it. */
export const filtersFromQuery = (query: LocationQuery): CommentFilters => ({
  search: text(query.search),
  author: text(query.author),
  state: oneOf(COMMENT_STATES, query.state) ?? 'all',
  pageType: oneOf(COMMENT_PAGE_TYPES, query.pageType) ?? '',
});

/** Only the filters set, so the default list has a clean URL. */
export function queryOfFilters(filters: CommentFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.search.trim()) query.search = filters.search.trim();
  if (filters.author.trim()) query.author = filters.author.trim();
  if (filters.state !== 'all') query.state = filters.state;
  if (filters.pageType) query.pageType = filters.pageType;
  return query;
}

export const apiQueryOf = (query: LocationQuery): AdminCommentQuery => {
  const { search, author, state, pageType } = filtersFromQuery(query);
  return {
    state,
    page: pageFromQuery(query.page),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(author.trim() ? { author: author.trim() } : {}),
    ...(pageType ? { pageType } : {}),
  };
};
