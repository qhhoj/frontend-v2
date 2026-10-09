import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchFlatpage, fetchFlatpages } from '@/api/flatpages-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const flatpagesKey = (page: number, viewer: string) =>
  ['admin', 'flatpages', page, viewer] as const;
export const flatpageKey = (id: string, viewer: string) =>
  ['admin', 'flatpage', id, viewer] as const;

export function useFlatpagesQuery(page: MaybeRefOrGetter<number>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => flatpagesKey(toValue(page), viewer.value)),
    queryFn: () => fetchFlatpages(toValue(page)),
  });
}

/** `id` is `null` on a page that does not exist yet: no request. */
export function useFlatpageQuery(id: MaybeRefOrGetter<string | null>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => flatpageKey(toValue(id) ?? '', viewer.value)),
    queryFn: () => fetchFlatpage(toValue(id)!),
    enabled: computed(() => toValue(id) !== null),
  });
}

/** The public flatpage cache (`['flatpages', path, viewer]`), stale after any admin save or delete. */
export const PUBLIC_FLATPAGES_KEY = ['flatpages'] as const;
