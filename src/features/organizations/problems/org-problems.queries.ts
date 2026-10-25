import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  ORG_PROBLEM_PAGE_SIZE,
  fetchArchivedIn,
  fetchOrganizationProblems,
  fetchProblemTags,
} from '@/api/organization-problems.api';
import type {
  OrganizationProblemArchiveFilter,
  OrganizationProblemQuery,
} from '@/api/types/organization-problems';
import { ANONYMOUS_VIEWER, useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForViewer } from '@/features/contests/keep-previous-for-viewer';

/** What the "Bài tập" tab reads from its URL. `tag` is a tag slug; `q` is '' when there is no search. */
export interface OrgProblemFilters {
  tag: string | null;
  archived: OrganizationProblemArchiveFilter;
  q: string;
  page: number;
}

export const orgProblemsKey = (slug: string, viewer: string) =>
  ['organizations', 'problems', slug, viewer] as const;

/** Empty filters stay out of the URL the server sees. */
export const queryOfFilters = (filters: OrgProblemFilters): OrganizationProblemQuery => ({
  ...(filters.tag ? { tag: filters.tag } : {}),
  archived: filters.archived,
  ...(filters.q ? { q: filters.q } : {}),
  page: filters.page,
  pageSize: ORG_PROBLEM_PAGE_SIZE,
});

export function useOrgProblemsQuery(
  slug: MaybeRefOrGetter<string>,
  filters: MaybeRefOrGetter<OrgProblemFilters>,
  isEnabled: MaybeRefOrGetter<boolean>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      ...orgProblemsKey(toValue(slug), viewer.value),
      { ...toValue(filters) },
    ]),
    queryFn: () => fetchOrganizationProblems(toValue(slug), queryOfFilters(toValue(filters))),
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
    enabled: computed(() => toValue(isEnabled)),
  });
}

export const problemTagsKey = (slug: string, viewer: string) =>
  ['organizations', 'problem-tags', slug, viewer] as const;

export function useProblemTagsQuery(
  slug: MaybeRefOrGetter<string>,
  isEnabled: MaybeRefOrGetter<boolean>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => problemTagsKey(toValue(slug), viewer.value)),
    queryFn: () => fetchProblemTags(toValue(slug)),
    enabled: computed(() => toValue(isEnabled)),
  });
}

/** Prefix of every archive notice; org archive writes invalidate it. */
export const ARCHIVED_IN_KEY = ['problems', 'archived-in'] as const;

/**
 * Signed-in viewers only (the route is authenticated: an anonymous request would fire the session-expired hook), and only
 * for a problem that lists an organization (no other problem can be archived anywhere).
 */
export function useArchivedInQuery(
  code: MaybeRefOrGetter<string>,
  hasOrganizations: MaybeRefOrGetter<boolean>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...ARCHIVED_IN_KEY, viewer.value, toValue(code)]),
    queryFn: () => fetchArchivedIn(toValue(code)),
    enabled: computed(() => viewer.value !== ANONYMOUS_VIEWER && toValue(hasOrganizations)),
  });
}
