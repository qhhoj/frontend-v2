import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchEditableContest } from '@/api/contest-editing.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Account-owned: the viewer id keeps one account's read of the editor from another's. */
export const editableContestKey = (key: string, viewer: string) =>
  ['admin', 'contest', key, viewer] as const;

export const useEditableContestQuery = (key: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => editableContestKey(toValue(key), viewer.value)),
    queryFn: () => fetchEditableContest(toValue(key)),
  });
};

/** The caches a contest write makes stale: the public contest pages, and the admin index the editor returns to. */
export const PUBLIC_CONTESTS_KEY = ['contests'] as const;
export const CONTEST_INDEX_KEY = ['admin', 'index', 'contests'] as const;
