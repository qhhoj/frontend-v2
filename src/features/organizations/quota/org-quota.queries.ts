import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchOrganizationUsage } from '@/api/organization-usage.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const usageKey = (slug: string, viewer: string) =>
  ['organizations', 'usage', slug, viewer] as const;

export function useOrganizationUsageQuery(
  slug: MaybeRefOrGetter<string>,
  isEnabled: MaybeRefOrGetter<boolean>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => usageKey(toValue(slug), viewer.value)),
    queryFn: () => fetchOrganizationUsage(toValue(slug)),
    enabled: computed(() => toValue(isEnabled)),
  });
}
