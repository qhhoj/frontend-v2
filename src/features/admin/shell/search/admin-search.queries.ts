import { useQueries } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import { MIN_RECORD_SEARCH, RECORD_SOURCES } from './admin-search';
import type { PaletteEntry } from './admin-search';

/** A palette hit stays fresh for a minute: retyping the same text does not ask again. */
const SEARCH_STALE_MS = 60_000;

/**
 * The record kinds this viewer may open, each looked up once `term` (already debounced) is long enough.
 * A kind whose screen the viewer cannot open is never asked for, so a limited staff member sees no 403.
 */
export function useAdminRecordSearch(term: Ref<string>) {
  const { canAny } = usePermissions();
  const viewerId = useViewerId();
  const locale = useLocaleStore();
  const sources = computed(() => RECORD_SOURCES.filter((source) => canAny(source.permission)));
  const isLongEnough = computed(() => term.value.length >= MIN_RECORD_SEARCH);
  const results = useQueries({
    queries: computed(() =>
      sources.value.map((source) => ({
        queryKey: ['admin', 'palette', source.group, viewerId.value, locale.locale, term.value],
        queryFn: () => source.search(term.value, locale.locale),
        enabled: isLongEnough.value,
        staleTime: SEARCH_STALE_MS,
      })),
    ),
  });
  const entries = computed<PaletteEntry[]>(() =>
    isLongEnough.value ? results.value.flatMap((result) => result.data ?? []) : [],
  );
  const isSearching = computed(
    () => isLongEnough.value && results.value.some((result) => result.isFetching),
  );
  const hasFailure = computed(
    () => isLongEnough.value && results.value.some((result) => result.isError),
  );
  return { entries, isSearching, hasFailure, isLongEnough };
}
