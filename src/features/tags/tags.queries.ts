import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchTagCatalog, fetchTagProblem, fetchTagProblems } from '@/api/tags.api';
import type { TagProblem, TagProblemQuery } from '@/api/tags.api';

const tagsKey = ['tags'] as const;
export const TAG_PROBLEMS_PAGE_SIZE = 50;
/** The judges the index accepts links from (backend `tag-links.ts`). */
export const TAG_JUDGES = ['Codeforces', 'CodeforcesGym', 'Atcoder', 'Kattis', 'VNOJ'] as const;
/** The rating that lets a user add problems and tags without `judge.add_tagproblem` (they must also have opted in). */
export const TAGGING_RATING = 1900;

export const useTagProblemsQuery = (query: MaybeRefOrGetter<TagProblemQuery>) =>
  useQuery({
    queryKey: computed(() => [...tagsKey, 'list', toValue(query)]),
    queryFn: () => fetchTagProblems(toValue(query)),
    placeholderData: keepPreviousData,
  });

/** The catalog changes only through the admin; a long stale time keeps the filter and the picker from refetching. */
export const useTagCatalogQuery = () =>
  useQuery({
    queryKey: [...tagsKey, 'catalog'],
    queryFn: fetchTagCatalog,
    select: (result) => result.groups,
    staleTime: 10 * 60_000,
  });

export const useTagProblemQuery = (code: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => [...tagsKey, 'problem', toValue(code)]),
    queryFn: () => fetchTagProblem(toValue(code)),
  });

/** After a write: the problem's own entry takes the answer, every list page refetches. */
export function useTagProblemCache() {
  const queryClient = useQueryClient();
  return (problem: TagProblem) => {
    queryClient.setQueryData([...tagsKey, 'problem', problem.code], problem);
    void queryClient.invalidateQueries({ queryKey: [...tagsKey, 'list'] });
  };
}

/** Whether the add and tag buttons show: the permission, or the rating (the server also needs the user's opt-in and says so). */
export const mayTag = (
  user: { rating: number | null } | null,
  can: (permission: string) => boolean,
): boolean =>
  user !== null && (can('judge.add_tagproblem') || (user.rating ?? 0) >= TAGGING_RATING);
