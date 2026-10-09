import type { Schemas } from '../schemas';
import type { QueryOf } from '../typed';

/** backend: libs/database STATEMENT_LANGUAGES; equal to the UI locales. */
export type StatementLanguage = Schemas['StatementLanguage'];
/** backend: problems/core/dto/user-summary.response.ts */
export type UserSummary = Schemas['UserSummaryResponse'];

export type CatalogItem = Schemas['CatalogItemResponse'];
export type Language = Schemas['LanguageResponse'];
export type ProblemMeta = Schemas['ProblemMetaResponse'];
export type ProblemListItem = Schemas['ProblemListItemResponse'];
export type ViewerStatus = ProblemListItem['viewerStatus'];
export type ProblemContest = Schemas['ProblemContestResponse'];
export type ProblemDetail = Schemas['ProblemDetailResponse'];
export type ProblemEditorial = Schemas['EditorialResponse'];

/** A sort is a field or `-field`. */
export type ProblemSort = Schemas['ProblemSort'];
export type ProblemSortField = Exclude<ProblemSort, `-${string}`>;
/** UI list of the sortable fields; `satisfies` fails the typecheck when the backend drops one. */
export const PROBLEM_SORT_FIELDS = [
  'date',
  'code',
  'name',
  'points',
  'acRate',
  'userCount',
] as const satisfies readonly ProblemSortField[];
export const isProblemSort = (value: unknown): value is ProblemSort =>
  typeof value === 'string' &&
  (PROBLEM_SORT_FIELDS as readonly string[]).includes(value.replace(/^-/, ''));

export type ProblemListQuery = QueryOf<'/problems'>;
