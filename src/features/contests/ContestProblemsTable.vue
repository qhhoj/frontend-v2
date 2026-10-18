<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { ExternalLink, Printer } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail, ContestPhase, ContestProblem } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import FactLine from '@/components/FactLine.vue';
import InlineBit from '@/components/InlineBit.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import OwnResultChip from './OwnResultChip.vue';
import { limitsText } from './contest-limits';
import { attemptsLeftUnderCap, ownResultContext, solvedSummary } from './own-result';

const props = defineProps<{ contest: ContestDetail }>();
const locale = useLocaleStore();
const { t } = useI18n();
const pointsOf = (problem: ContestProblem) =>
  formatNumber(problem.points, locale.locale, props.contest.pointsPrecision);
const problemLink = (problem: ContestProblem) => ({
  name: 'problem',
  params: { code: problem.code },
});
/** Why the statements are not listed yet, per phase. */
const HIDDEN_KEYS: Record<ContestPhase, string> = {
  upcoming: 'contests.problems.afterStart',
  running: 'contests.problems.afterJoin',
  ended: 'contests.problems.hidden',
};

const problems = computed(() => props.contest.problems ?? []);
const hasOwnResults = computed(() =>
  problems.value.some((problem) => problem.viewerResult !== null),
);
const context = computed(() => ownResultContext(props.contest, locale.locale));
const solvedCounts = computed(() => solvedSummary(problems.value));
const isCrowned = computed(() => props.contest.phase === 'ended' && solvedCounts.value.solved > 0);
/**
 * The attempt cap under the problem's name, with what the viewer has left once they have a result; null when the
 * problem has no cap (most do not, so no column of ∞ for it, P-23).
 */
const capLineOf = (problem: ContestProblem): string | null => {
  const cap = problem.maxSubmissions;
  if (!cap) return null;
  const text = t('contests.problems.cap', { count: formatNumber(cap, locale.locale) }, cap);
  if (!problem.viewerResult) return text;
  const left = attemptsLeftUnderCap(cap, problem.viewerResult.attempts);
  return `${text} (${t('contests.problems.left', { count: left }, left)})`;
};
const capLines = computed(
  () => new Map(problems.value.map((problem) => [problem.problemId, capLineOf(problem)])),
);
/** A phone row's meta: code, attempt cap, limits, points; each a whole fact (M-13). */
const phoneFacts = (problem: ContestProblem) =>
  [
    problem.code,
    capLines.value.get(problem.problemId),
    limitsText(problem),
    t('contests.problems.pointsShort', { points: pointsOf(problem) }),
  ].filter((fact): fact is string => Boolean(fact));
</script>

<template>
  <Card data-testid="contest-problems" class="overflow-hidden">
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
        <AppButton :to="{ name: 'contest-all', params: { key: contest.key } }" class="shrink-0">
          <template #icon><Printer class="size-4" aria-hidden="true" /></template>
          {{ $t('contests.problems.printAll') }}
        </AppButton>
      </div>
      <table class="hidden w-full border-collapse md:table">
        <caption class="sr-only">
          {{
            $t('contests.problems.caption')
          }}
        </caption>
        <thead>
          <tr class="text-left text-caption tracking-wider text-muted uppercase">
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
            <th v-if="hasOwnResults" scope="col" class="px-3 py-3 font-semibold whitespace-nowrap">
              {{ $t('contests.problems.columns.own') }}
            </th>
            <th scope="col" class="px-3 py-3">
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
            <td class="w-full max-w-0 min-w-28 px-3 py-3">
              <RouterLink
                :to="problemLink(problem)"
                :title="problem.name"
                class="block truncate font-semibold hover:text-accent-text"
                >{{ problem.name }}</RouterLink
              >
              <span :title="problem.code" class="block truncate font-mono text-caption text-muted">
                {{ problem.code }}
              </span>
              <span v-if="capLines.get(problem.problemId)" class="block text-caption text-muted">
                {{ capLines.get(problem.problemId) }}
              </span>
            </td>
            <td class="px-3 py-3 font-mono text-meta whitespace-nowrap tabular-nums">
              {{ limitsText(problem) }}
            </td>
            <td class="px-3 py-3 text-right font-mono tabular-nums">{{ pointsOf(problem) }}</td>
            <td v-if="hasOwnResults" class="max-w-40 px-3 py-3 xl:max-w-none">
              <OwnResultChip :problem="problem" :context="context" />
            </td>
            <td class="px-3 py-3 text-right">
              <AppButton :to="problemLink(problem)" icon-only :title="$t('contests.problems.open')">
                <span class="sr-only"
                  >{{ $t('contests.problems.open') }} {{ problem.label }}. {{ problem.name }}</span
                ><ExternalLink class="size-4" aria-hidden="true" />
              </AppButton>
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
              ><span class="line-clamp-2">{{ problem.name }}</span></RouterLink
            >
            <FactLine class="font-mono text-caption text-muted" :facts="phoneFacts(problem)" />
          </div>
          <OwnResultChip v-if="hasOwnResults" :problem="problem" :context="context" />
        </li>
      </ul>
    </template>
  </Card>
</template>
