import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { useOrgProblemsQuery } from '../problems/org-problems.queries';
import { useJoinRequestsQuery } from '../organizations.queries';

/** How many rows each list card of the Quản lý page shows. */
export const MANAGE_LIST_SIZE = 5;
const FIRST_PAGE = { tag: null, archived: 'false', q: '', page: 1 } as const;

/**
 * The Quản lý page's reads: pending requests, the first problems and the first contests of the organization. The tiles and
 * the cards call this with the same keys, so vue-query sends each request once.
 */
export function useManageLists(organization: MaybeRefOrGetter<OrganizationDetail>) {
  const slug = () => toValue(organization).slug;
  const pending = useJoinRequestsQuery(slug, 'P', 1, true);
  const problems = useOrgProblemsQuery(slug, FIRST_PAGE, true);
  const contestQuery = computed(() => ({
    organization: toValue(organization).id,
    page: 1,
    pageSize: MANAGE_LIST_SIZE,
  }));
  const contests = useContestListQuery(contestQuery);
  return {
    pending,
    problems,
    contests,
    pendingTotal: computed(() => pending.data.value?.meta.total ?? 0),
    problemTotal: computed(() => problems.data.value?.meta.total ?? 0),
    contestTotal: computed(() => contests.data.value?.meta.total ?? 0),
  };
}
