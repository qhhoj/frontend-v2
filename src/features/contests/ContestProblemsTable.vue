<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail, ContestPhase, ContestProblem } from '@/api/types/contests';
import { TABLE_HEAD_CELL, TABLE_ROW_HEIGHT } from '@/components/ui/table-classes';
import Card from '@/components/ui/Card.vue';
import InlineBit from '@/components/InlineBit.vue';
import { formatNumber, formatPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import OwnResultChip from './OwnResultChip.vue';
import { limitsText } from './contest-limits';
import { attemptsLeftUnderCap, ownResultContext, solvedSummary } from './own-result';

/**
 * The contest's problems, one row each and the whole row opens the statement: label, name (with its code), my own result
 * ("Của tôi": lamp, score or tries, time), how many solved it (a neutral bar against the contestants, and the number)
 * and the points. No row tint: the colour sits on my result. The solver, limit and own columns show only when some
 * problem has a value for them, so no column is a run of dashes.
 */
const props = defineProps<{ contest: ContestDetail }>();
const locale = useLocaleStore();
const { t } = useI18n();
const pointsOf = (problem: ContestProblem) =>
  formatPoints(problem.points, locale.locale, props.contest.pointsPrecision);
const problemLink = (problem: ContestProblem) => ({
  name: 'problem',
  params: { code: problem.code },
  query: { contest: props.contest.key },
});
/** Why the statements are not listed yet, per phase. */
const HIDDEN_KEYS: Record<ContestPhase, string> = {
  upcoming: 'contests.problems.afterStart',
  running: 'contests.problems.afterJoin',
  ended: 'contests.problems.hidden',
};

const hasLimit = (problem: ContestProblem) => limitsText(problem) !== '—';
const problems = computed(() => props.contest.problems ?? []);
/** "Của tôi" shows once I take part (every row then says at least "Chưa nộp") or have a result on some problem. */
const hasOwnResults = computed(
  () =>
    props.contest.viewer.liveParticipation !== null ||
    problems.value.some((problem) => problem.viewerResult !== null),
);
const hasLimits = computed(() => problems.value.some(hasLimit));
const hasSolvers = computed(() => problems.value.some((problem) => problem.solverCount !== null));
/** The solver bar is read against the contestants; a count over it (virtual runs) fills the bar. */
const solverPercent = (problem: ContestProblem) =>
  props.contest.userCount > 0
    ? Math.min(100, ((problem.solverCount ?? 0) / props.contest.userCount) * 100)
    : 0;
const context = computed(() => ownResultContext(props.contest, locale.locale));
const solvedCounts = computed(() => solvedSummary(problems.value));
const isCrowned = computed(() => props.contest.phase === 'ended' && solvedCounts.value.solved > 0);
/**
 * The attempt cap beside the problem's code, with what the viewer has left once they have a result; null when the
 * problem has no cap (most do not, so no column of ∞ for it).
 */
const capLineOf = (problem: ContestProblem): string | null => {
  const cap = problem.maxSubmissions;
  if (!cap) return null;
  const text = t('contests.problems.cap', { count: formatNumber(cap, locale.locale) }, cap);
  if (!problem.viewerResult) return text;
  const left = attemptsLeftUnderCap(cap, problem.viewerResult.attempts);
  return `${text} (${t('contests.problems.left', { count: left }, left)})`;
};
const HEAD = 'px-3 font-semibold';
</script>

<template>
  <Card v-if="!contest.problems" data-testid="contest-problems">
    <p class="py-4 text-center text-muted">{{ $t(HIDDEN_KEYS[contest.phase]) }}</p>
  </Card>
  <section v-else data-testid="contest-problems" class="min-w-0">
    <p
      v-if="isCrowned"
      data-testid="solved-summary"
      class="flex items-center gap-3 pb-3 font-semibold"
    >
      <InlineBit kind="crown" />
      {{
        $t('contests.problems.solvedSummary', {
          solved: solvedCounts.solved,
          total: solvedCounts.total,
        })
      }}
    </p>
    <table class="w-full border-collapse">
      <caption class="sr-only">
        {{
          $t('contests.problems.caption')
        }}
      </caption>
      <thead>
        <tr :class="['border-b border-line-strong text-left', TABLE_HEAD_CELL]">
          <th scope="col" class="w-11 pr-3 font-semibold">
            {{ $t('contests.problems.columns.label') }}
          </th>
          <th scope="col" :class="HEAD">{{ $t('contests.problems.columns.name') }}</th>
          <th v-if="hasOwnResults" scope="col" :class="HEAD">
            {{ $t('contests.problems.columns.own') }}
          </th>
          <th v-if="hasLimits" scope="col" :class="[HEAD, 'max-2xl:hidden']">
            {{ $t('problemSwitcher.limitsColumn') }}
          </th>
          <th v-if="hasSolvers" scope="col" :class="[HEAD, 'text-right max-md:hidden']">
            {{ $t('contests.stats.columns.solvers') }}
          </th>
          <th scope="col" class="pl-3 text-right font-semibold">
            {{ $t('contests.problems.columns.points') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="problem in contest.problems"
          :key="problem.problemId"
          class="relative border-b border-line hover:bg-surface-hover"
        >
          <th scope="row" :class="['pr-3 text-left font-mono font-bold', TABLE_ROW_HEIGHT]">
            {{ problem.label }}
          </th>
          <td class="w-full max-w-0 min-w-28 px-3">
            <span class="flex min-w-0 items-baseline gap-3">
              <RouterLink
                :to="problemLink(problem)"
                :title="problem.name"
                class="truncate font-semibold after:absolute after:inset-0 hover:text-accent-text"
                >{{ problem.name }}</RouterLink
              >
              <span class="shrink-0 font-mono text-small text-muted max-md:hidden">
                {{ problem.code }}
              </span>
              <span v-if="capLineOf(problem)" class="shrink-0 text-small text-muted max-md:hidden">
                {{ capLineOf(problem) }}
              </span>
            </span>
          </td>
          <td v-if="hasOwnResults" class="px-3">
            <OwnResultChip :problem="problem" :context="context" />
          </td>
          <td
            v-if="hasLimits"
            class="px-3 font-mono text-meta whitespace-nowrap text-muted tabular-nums max-2xl:hidden"
          >
            {{ hasLimit(problem) ? limitsText(problem) : '' }}
          </td>
          <td v-if="hasSolvers" class="px-3 max-md:hidden">
            <span
              v-if="problem.solverCount !== null"
              class="flex items-center justify-end gap-3 font-mono whitespace-nowrap tabular-nums"
            >
              <span
                aria-hidden="true"
                class="block h-1 w-14 overflow-hidden rounded-pill bg-surface-strong"
              >
                <span
                  class="block h-full rounded-pill bg-muted"
                  :style="{ width: `${solverPercent(problem)}%` }"
                />
              </span>
              {{ formatNumber(problem.solverCount, locale.locale) }}
            </span>
          </td>
          <td class="pl-3 text-right font-mono whitespace-nowrap tabular-nums">
            {{ pointsOf(problem) }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
