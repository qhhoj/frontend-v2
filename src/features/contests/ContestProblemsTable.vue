<script setup lang="ts">
import { ExternalLink, Printer } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail, ContestPhase, ContestProblem } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import { formatNumber } from '@/lib/format';
import { showsCellTime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useLocaleStore } from '@/stores/locale.store';
import OwnResultChip from './OwnResultChip.vue';
import { limitsText } from './contest-limits';
import { attemptsLeftUnderCap, solvedSummary } from './own-result';

const props = defineProps<{ contest: ContestDetail }>();
const locale = useLocaleStore();
const { t } = useI18n();
const pointsOf = (problem: ContestProblem) =>
  formatNumber(problem.points, locale.locale, props.contest.pointsPrecision);
const problemLink = (problem: ContestProblem) => ({
  name: 'problem',
  params: { code: problem.code },
});
/** The attempt cap line, shown only for problems that cap their submissions. */
const capText = (cap: number) => t('contests.problems.cap', { count: cap }, cap);
/** Why the statements are not listed yet, per phase. */
const HIDDEN_KEYS: Record<ContestPhase, string> = {
  upcoming: 'contests.problems.afterStart',
  running: 'contests.problems.afterJoin',
  ended: 'contests.problems.hidden',
};

const problems = computed(() => props.contest.problems ?? []);
/** Null solver counts (the viewer may not see the full ranking) draw a dash, never a zero. */
const hasSolverCounts = computed(() =>
  problems.value.some((problem) => problem.solverCount !== null),
);
const hasOwnResults = computed(() =>
  problems.value.some((problem) => problem.viewerResult !== null),
);
const context = computed<RankingContext>(() => ({
  formatName: props.contest.formatName,
  pointsPrecision: props.contest.pointsPrecision,
  locale: locale.locale,
  showsTime: showsCellTime(props.contest.formatName, props.contest.formatConfig),
}));
const solvedCounts = computed(() => solvedSummary(problems.value));
const isCrowned = computed(() => props.contest.phase === 'ended' && solvedCounts.value.solved > 0);
const formatCount = (count: number) => formatNumber(count, locale.locale);
/** The cap line, with the attempts the viewer has left once they have a result. */
const leftText = (count: number) => t('contests.problems.left', { count }, count);
</script>

<template>
  <GlassCard data-testid="contest-problems" class="overflow-hidden">
    <p
      v-if="isCrowned"
      data-testid="solved-summary"
      class="flex items-center gap-3 border-b border-line px-5 py-3 font-semibold"
    >
      <InlineBit kind="crown" />
      {{
        $t('contests.problems.solvedSummary', {
          solved: solvedCounts.solved,
          total: solvedCounts.total,
        })
      }}
    </p>
    <p v-if="!contest.problems" class="px-5 py-8 text-center text-muted">
      {{ $t(HIDDEN_KEYS[contest.phase]) }}
    </p>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 class="min-w-0 font-display text-lg font-bold whitespace-nowrap">
          {{ $t('contests.problems.heading') }}
          <span class="text-sm font-normal text-muted">({{ problems.length }})</span>
        </h2>
        <RouterLink
          :to="{ name: 'contest-all', params: { key: contest.key } }"
          class="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border border-accent bg-accent-soft px-3.5 text-sm font-semibold whitespace-nowrap text-accent-soft-text hover:bg-surface-hover"
          ><Printer class="size-4" aria-hidden="true" />{{
            $t('contests.problems.printAll')
          }}</RouterLink
        >
      </div>
      <table class="hidden w-full border-collapse md:table">
        <caption class="sr-only">
          {{
            $t('contests.problems.caption')
          }}
        </caption>
        <thead>
          <tr class="text-left text-[12px] tracking-wider text-muted uppercase">
            <th scope="col" class="px-5 py-3 font-semibold">
              {{ $t('contests.problems.columns.label') }}
            </th>
            <th scope="col" class="px-3 py-3 font-semibold">
              {{ $t('contests.problems.columns.name') }}
            </th>
            <th scope="col" class="px-3 py-3 font-semibold whitespace-nowrap">
              {{ $t('problemSwitcher.limitsColumn') }}
            </th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">
              {{ $t('contests.problems.columns.points') }}
            </th>
            <th v-if="hasSolverCounts" scope="col" class="px-3 py-3 text-right font-semibold">
              {{ $t('contests.problems.columns.solvers') }}
            </th>
            <th v-if="hasOwnResults" scope="col" class="px-3 py-3 font-semibold">
              {{ $t('contests.problems.columns.own') }}
            </th>
            <th scope="col" class="px-5 py-3">
              <span class="sr-only">{{ $t('contests.problems.columns.open') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="problem in contest.problems"
            :key="problem.problemId"
            class="border-t border-line"
          >
            <th scope="row" class="px-5 py-3 text-left font-display text-xl font-bold">
              {{ problem.label }}
            </th>
            <td class="px-3 py-3">
              <RouterLink :to="problemLink(problem)" class="font-semibold hover:text-accent-text">{{
                problem.name
              }}</RouterLink>
              <span class="block font-mono text-[12.5px] text-muted">
                {{ problem.code
                }}<template v-if="problem.maxSubmissions">
                  · {{ capText(problem.maxSubmissions) }}</template
                ><template v-if="problem.viewerResult && problem.maxSubmissions !== null">
                  ·
                  {{
                    leftText(
                      attemptsLeftUnderCap(problem.maxSubmissions, problem.viewerResult.attempts),
                    )
                  }}</template
                >
              </span>
            </td>
            <td class="px-3 py-3 font-mono text-[13px] whitespace-nowrap tabular-nums">
              {{ limitsText(problem) }}
            </td>
            <td class="px-3 py-3 text-right font-mono tabular-nums">{{ pointsOf(problem) }}</td>
            <td v-if="hasSolverCounts" class="px-3 py-3 text-right font-mono tabular-nums">
              {{ problem.solverCount === null ? '—' : formatCount(problem.solverCount) }}
            </td>
            <td v-if="hasOwnResults" class="px-3 py-3">
              <OwnResultChip :problem="problem" :context="context" />
            </td>
            <td class="px-5 py-3 text-right">
              <RouterLink
                :to="problemLink(problem)"
                class="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
              >
                {{ $t('contests.problems.open')
                }}<span class="sr-only"> {{ problem.label }}. {{ problem.name }}</span
                ><ExternalLink class="size-4" aria-hidden="true" />
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <ul class="m-0 list-none p-0 md:hidden">
        <li
          v-for="problem in contest.problems"
          :key="problem.problemId"
          class="flex min-h-16 items-center gap-3 border-t border-line px-3.5 py-3 first:border-t-0"
        >
          <span class="w-7 font-display text-[22px] font-bold" aria-hidden="true">
            {{ problem.label }}
          </span>
          <div class="min-w-0 flex-1">
            <RouterLink
              :to="problemLink(problem)"
              class="flex min-h-11 min-w-0 items-center font-semibold"
              ><span class="sr-only">{{ problem.label }}. </span
              ><span class="truncate">{{ problem.name }}</span></RouterLink
            >
            <p class="text-[12px] text-muted">
              {{ problem.code
              }}<template v-if="problem.maxSubmissions">
                · {{ capText(problem.maxSubmissions) }}</template
              >
              · {{ limitsText(problem) }}
              ·
              {{ $t('contests.problems.pointsShort', { points: pointsOf(problem) }) }}
              <template v-if="problem.solverCount !== null">
                ·
                {{
                  $t(
                    'contests.problems.solvers',
                    { count: formatCount(problem.solverCount) },
                    problem.solverCount,
                  )
                }}
              </template>
            </p>
          </div>
          <OwnResultChip v-if="hasOwnResults" :problem="problem" :context="context" />
        </li>
      </ul>
    </template>
  </GlassCard>
</template>
