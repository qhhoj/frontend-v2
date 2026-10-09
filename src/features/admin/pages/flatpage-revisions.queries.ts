import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchFlatpageRevisions } from '@/api/flatpages-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const flatpageRevisionsKey = (id: string, page: number, viewer: string) =>
  ['admin', 'flatpage-revisions', id, page, viewer] as const;

/** `id` is `null` on a page that does not exist yet: no request, no tab. */
export function useFlatpageRevisionsQuery(
  id: MaybeRefOrGetter<string | null>,
  page: MaybeRefOrGetter<number>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => flatpageRevisionsKey(toValue(id) ?? '', toValue(page), viewer.value)),
    queryFn: () => fetchFlatpageRevisions(toValue(id)!, toValue(page)),
    enabled: computed(() => toValue(id) !== null),
  });
}
