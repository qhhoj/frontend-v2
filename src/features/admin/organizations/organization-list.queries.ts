import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchAdminOrganizations } from '@/api/organizations-admin.api';
import type { OrganizationListFilters } from '@/api/organizations-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';

/** The staff list under `['organizations', 'list', …]`, so every organization write refreshes it too. */
export const useAdminOrganizationsQuery = (
  page: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string>,
  filters: MaybeRefOrGetter<OrganizationListFilters>,
  enabled: MaybeRefOrGetter<boolean>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'organizations',
      'list',
      'admin',
      toValue(page),
      toValue(search),
      { ...toValue(filters) },
      viewer.value,
    ]),
    queryFn: () => fetchAdminOrganizations(toValue(page), toValue(search), toValue(filters)),
    placeholderData: computed(() => keepPreviousForSameViewer(6, viewer.value)),
    enabled: () => toValue(enabled),
  });
};
