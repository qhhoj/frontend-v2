import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchAllJoinRequests } from '@/api/organizations-admin.api';
import type { JoinRequestState } from '@/api/types/organizations';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';

/** Backend `OrganizationRequestQueueController`: a holder of `judge.add_organization` alone gets a 403, so the query stays idle for them. */
export const ORGANIZATION_QUEUE_PERMISSION = 'judge.edit_all_organization';
export const allJoinRequestsKey = ['admin', 'organization-requests'] as const;

export const useAllJoinRequestsQuery = (
  state: MaybeRefOrGetter<JoinRequestState>,
  page: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string> = '',
) => {
  const viewer = useViewerId();
  const { can } = usePermissions();
  return useQuery({
    queryKey: computed(() => [
      ...allJoinRequestsKey,
      toValue(state),
      toValue(page),
      toValue(search),
      viewer.value,
    ]),
    queryFn: () => fetchAllJoinRequests(toValue(state), toValue(page), toValue(search)),
    enabled: computed(() => can(ORGANIZATION_QUEUE_PERMISSION)),
    placeholderData: computed(() => keepPreviousForSameViewer(5, viewer.value)),
  });
};
