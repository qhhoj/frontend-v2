import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchAdminProblems } from '@/api/admin-index.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { listStepsOf } from '../../search/problem-setup-marks';
import type { ListStep } from '../../search/problem-setup-marks';

/** The list endpoint's largest page. */
const PAGE_SIZE = 100;
/** How many matches one search by code reads: the exact code is among the first. */
const CODE_MATCHES = 8;

type Marks = Map<string, readonly ListStep[]>;

/**
 * The setup steps of the contest's problems, by code. The contest's own problem rows carry no setup state, so it is
 * joined from the list of problems the viewer may edit: one request for a teacher with up to 100 problems. A viewer
 * with more (a site editor) gets one more request per contest problem not on that first page, searched by its code.
 * A problem the viewer may not edit has no entry: the table then shows no mark, never a guess.
 */
async function fetchMarks(codes: readonly string[]): Promise<Marks> {
  const marks: Marks = new Map();
  const wanted = new Set(codes);
  const keep = (problem: Parameters<typeof listStepsOf>[0] & { code: string }) => {
    const steps = wanted.has(problem.code) ? listStepsOf(problem) : null;
    if (steps) marks.set(problem.code, steps);
  };
  const first = await fetchAdminProblems({ pageSize: PAGE_SIZE, page: 1 });
  first.items.forEach(keep);
  const hasMore = (first.meta.total ?? first.items.length) > first.items.length;
  const unread = hasMore ? codes.filter((code) => !marks.has(code)) : [];
  const searched = await Promise.all(
    unread.map((code) => fetchAdminProblems({ q: code, pageSize: CODE_MATCHES })),
  );
  searched.forEach((page) => page.items.forEach(keep));
  return marks;
}

export function useContestProblemMarks(codes: () => readonly string[]) {
  const viewer = useViewerId();
  const sorted = computed(() => [...codes()].sort());
  const query = useQuery({
    queryKey: computed(() => ['admin', 'contest-problem-marks', viewer.value, sorted.value]),
    queryFn: () => fetchMarks(sorted.value),
    enabled: computed(() => sorted.value.length > 0),
  });
  const EMPTY: Marks = new Map();
  return {
    marks: computed(() => query.data.value ?? EMPTY),
    /** True while the marks are still being read: the plate must not call the contest ready yet. */
    isLoading: computed(() => sorted.value.length > 0 && query.isPending.value),
  };
}
