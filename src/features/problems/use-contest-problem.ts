import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import { ownResultContext } from '@/features/contests/own-result';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { ScoreScale } from './submit-result';

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

/**
 * What a score on this problem is out of (Q-10 A): the contest's points and decimals inside the viewer's contest, else the
 * problem's own. The result strip and the rail's "Bài nộp của tôi" both score on it.
 */
export function useScoreScale(
  problem: () => ProblemDetail,
  contest: () => ContestDetail | null | undefined,
) {
  const { contestProblem } = useContestProblem(problem, contest);
  return computed<ScoreScale>(() => {
    const inContest = contestProblem.value;
    const current = contest();
    return {
      problemPoints: problem().points,
      contest:
        inContest && current
          ? {
              key: current.key,
              points: inContest.points,
              partial: inContest.partial,
              precision: current.pointsPrecision,
            }
          : null,
    };
  });
}
