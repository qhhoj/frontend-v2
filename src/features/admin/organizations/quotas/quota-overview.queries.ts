import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchOrganizationUsage, fetchUsageOverview } from '@/api/organization-usage.api';
import type { UsageSort } from '@/api/types/organization-usage';
import { useViewerId } from '@/stores/use-viewer-id';

export const USAGE_OVERVIEW_KEY = ['admin', 'organization-usage'] as const;
export const USAGE_DETAIL_KEY = ['admin', 'organization-usage-detail'] as const;

export function useUsageOverviewQuery(
  sort: MaybeRefOrGetter<UsageSort>,
  page: MaybeRefOrGetter<number>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...USAGE_OVERVIEW_KEY, viewer.value, toValue(sort), toValue(page)]),
    queryFn: () => fetchUsageOverview(toValue(sort), toValue(page)),
    placeholderData: keepPreviousData,
  });
}

/** The current overrides of one organization, read when its quota editor opens; idle while `slug` is null. */
export function useUsageDetailQuery(slug: MaybeRefOrGetter<string | null>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...USAGE_DETAIL_KEY, viewer.value, toValue(slug)]),
    queryFn: () => fetchOrganizationUsage(toValue(slug) ?? ''),
    enabled: computed(() => toValue(slug) !== null),
  });
}
