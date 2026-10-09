import type { Page } from './client';
import { apiGet, apiGetPage, apiSend } from './typed';
import type {
  ArchivedIn,
  BulkBody,
  BulkProblemsResult,
  OrganizationProblem,
  OrganizationProblemQuery,
  ProblemTag,
  ProblemTagBody,
  ProblemTagChanges,
} from './types/organization-problems';

/** The catalogue holds at most 100 tags (`tag_limit_reached` beyond): one page of 100 is all of them. */
export const TAG_PAGE_SIZE = 100;
export const ORG_PROBLEM_PAGE_SIZE = 50;

export const fetchOrganizationProblems = (
  slug: string,
  query: OrganizationProblemQuery,
): Promise<Page<OrganizationProblem>> =>
  apiGetPage('/organizations/{slug}/problems', { path: { slug }, query });

export const fetchProblemTags = (slug: string): Promise<Page<ProblemTag>> =>
  apiGetPage('/organizations/{slug}/problem-tags', {
    path: { slug },
    query: { pageSize: TAG_PAGE_SIZE },
  });

export const createProblemTag = (slug: string, body: ProblemTagBody): Promise<ProblemTag> =>
  apiSend('post', '/organizations/{slug}/problem-tags', { path: { slug }, body });

/** A tag is addressed by its slug, which never changes. */
export const updateProblemTag = (
  slug: string,
  tagSlug: string,
  body: ProblemTagChanges,
): Promise<ProblemTag> =>
  apiSend('patch', '/organizations/{slug}/problem-tags/{tagSlug}', {
    path: { slug, tagSlug },
    body,
  });

export const deleteProblemTag = (slug: string, tagSlug: string): Promise<void> =>
  apiSend('delete', '/organizations/{slug}/problem-tags/{tagSlug}', { path: { slug, tagSlug } });

/** Tag writes use tag ids (the filter uses slugs). */
export const setProblemTags = (
  slug: string,
  code: string,
  tagIds: string[],
): Promise<OrganizationProblem> =>
  apiSend('put', '/organizations/{slug}/problems/{code}/tags', {
    path: { slug, code },
    body: { tagIds },
  });

export const archiveProblem = (slug: string, code: string): Promise<void> =>
  apiSend('post', '/organizations/{slug}/problems/{code}/archive', { path: { slug, code } });

export const unarchiveProblem = (slug: string, code: string): Promise<void> =>
  apiSend('delete', '/organizations/{slug}/problems/{code}/archive', { path: { slug, code } });

export const runBulk = (slug: string, body: BulkBody): Promise<BulkProblemsResult> =>
  apiSend('post', '/organizations/{slug}/problems/bulk', { path: { slug }, body });

/** Signed-in viewers only: the route is authenticated, an anonymous call would answer 401. */
export const fetchArchivedIn = (code: string): Promise<ArchivedIn> =>
  apiGet('/problems/{code}/archived-in', { path: { code } });
