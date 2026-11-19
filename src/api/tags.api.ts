import { apiGet, apiGetPage, apiSend } from './typed';
import type { QueryOf } from './typed';
import type { Schemas } from './schemas';

/** A problem on another online judge that users tagged, with its tags. */
export type TagProblemListItem = Schemas['TagProblemListItemResponse'];
/** One tagged problem with who assigned each tag. */
export type TagProblem = Schemas['TagProblemResponse'];
export type TagGroup = Schemas['TagGroupResponse'];
export type TagProblemQuery = QueryOf<'/tags'>;

/** Public. Filter by `tag`, `search` (code or name) and `judges`. */
export const fetchTagProblems = (query: TagProblemQuery) => apiGetPage('/tags', { query });
/** Public. The tag groups, each with its tags. */
export const fetchTagCatalog = () => apiGet('/tags/catalog');
export const fetchTagProblem = (code: string) => apiGet('/tags/{code}', { path: { code } });
/** Needs an opted-in user with `judge.add_tagproblem` or a rating of 1900; 409 `conflict` when the problem exists. */
export const createTagProblem = (body: { link: string; name: string }) =>
  apiSend('post', '/tags', { body });
/** Same rights as adding; tags the problem already has are ignored. */
export const assignTags = (code: string, tagCodes: string[]) =>
  apiSend('post', '/tags/{code}/assign', { path: { code }, body: { tagCodes } });
