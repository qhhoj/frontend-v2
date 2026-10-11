import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchDeletedFlatpages, fetchFlatpage, fetchFlatpages } from '@/api/flatpages-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const flatpagesKey = (page: number, viewer: string, search = '') =>
  ['admin', 'flatpages', page, viewer, search] as const;
export const deletedFlatpagesKey = (page: number, viewer: string) =>
  ['admin', 'flatpages-deleted', page, viewer] as const;
export const flatpageKey = (id: string, viewer: string) =>
  ['admin', 'flatpage', id, viewer] as const;

/** `search`: the url or the title contains it. */
export function useFlatpagesQuery(
  page: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string> = '',
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => flatpagesKey(toValue(page), viewer.value, toValue(search))),
    queryFn: () => fetchFlatpages(toValue(page), toValue(search)),
  });
}

/** Deleted pages are listed on demand: `enabled` is false until the section is opened. */
export function useDeletedFlatpagesQuery(
  page: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => deletedFlatpagesKey(toValue(page), viewer.value)),
    queryFn: () => fetchDeletedFlatpages(toValue(page)),
    enabled: computed(() => toValue(enabled)),
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
