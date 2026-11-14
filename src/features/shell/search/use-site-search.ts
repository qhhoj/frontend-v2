import { useQueries } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { MIN_RECORD_SEARCH, RECORD_SOURCES } from './site-search';
import type { SearchEntry } from './site-search';

/** A hit stays fresh for a minute: retyping the same text does not ask again. */
const SEARCH_STALE_MS = 60_000;

/** The records matching `term` (already debounced), each kind looked up once the text is long enough. */
export function useSiteRecordSearch(term: Ref<string>) {
  const session = useSessionStore();
  const viewerId = useViewerId();
  const locale = useLocaleStore();
  const sources = computed(() =>
    RECORD_SOURCES.filter((source) => !source.needsAccount || session.user !== null),
  );
  const isLongEnough = computed(() => term.value.length >= MIN_RECORD_SEARCH);
  const results = useQueries({
    queries: computed(() =>
      sources.value.map((source) => ({
        queryKey: ['site-search', source.group, viewerId.value, locale.locale, term.value],
        queryFn: () => source.search(term.value, locale.locale),
        enabled: isLongEnough.value,
        staleTime: SEARCH_STALE_MS,
      })),
    ),
  });
  const entries = computed<SearchEntry[]>(() =>
    isLongEnough.value ? results.value.flatMap((result) => result.data ?? []) : [],
  );
  const isSearching = computed(
    () => isLongEnough.value && results.value.some((result) => result.isFetching),
  );
  const hasFailure = computed(
    () => isLongEnough.value && results.value.some((result) => result.isError),
  );
  return { entries, isSearching, hasFailure };
}
