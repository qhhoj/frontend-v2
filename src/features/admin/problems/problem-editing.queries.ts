import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchEditableProblem, fetchProblemEditingMeta } from '@/api/problem-editing.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const editableProblemKey = (code: string, viewer: string) =>
  ['admin', 'problem', code, viewer] as const;

export function useEditableProblemQuery(code: MaybeRefOrGetter<string>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => editableProblemKey(toValue(code), viewer.value)),
    queryFn: () => fetchEditableProblem(toValue(code)),
  });
}

export const useProblemEditingMetaQuery = () =>
  useQuery({
    queryKey: ['admin', 'problem-meta'],
    queryFn: fetchProblemEditingMeta,
    staleTime: Infinity,
  });

/** The caches a problem write makes stale: the public problem pages, and the admin index the editor returns to. */
export const PUBLIC_PROBLEMS_KEY = ['problems'] as const;
export const PROBLEM_INDEX_KEY = ['admin', 'index', 'problems'] as const;
