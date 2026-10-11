import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchOrganizationHistory } from '@/api/organizations-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Under `['organizations', …]`, so every organization write (edit, kick) refreshes it. */
export const organizationHistoryKey = (slug: string) => ['organizations', 'history', slug] as const;

export const useOrganizationHistoryQuery = (
  slug: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      ...organizationHistoryKey(toValue(slug)),
      toValue(page),
      viewer.value,
    ]),
    queryFn: () => fetchOrganizationHistory(toValue(slug), toValue(page)),
    placeholderData: keepPreviousData,
  });
};
