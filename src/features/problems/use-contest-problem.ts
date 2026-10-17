import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import { ownResultContext } from '@/features/contests/own-result';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * This problem as the viewer's contest lists it (P-15): its contest points and the context of the viewer's own cell. Null
 * outside a contest; the facts card and the limit strip then show the site-wide numbers.
 */
export function useContestProblem(
  problem: () => ProblemDetail,
  contest: () => ContestDetail | null | undefined,
) {
  const locale = useLocaleStore();
  const contestProblem = computed(
    () => contest()?.problems?.find((candidate) => candidate.code === problem().code) ?? null,
  );
  const ownContext = computed(() => {
    const current = contest();
    return current ? ownResultContext(current, locale.locale) : null;
  });
  const contestPoints = computed(() => {
    const current = contest();
    return contestProblem.value && current
      ? formatNumber(contestProblem.value.points, locale.locale, current.pointsPrecision)
      : null;
  });
  return { contestProblem, ownContext, contestPoints };
}
