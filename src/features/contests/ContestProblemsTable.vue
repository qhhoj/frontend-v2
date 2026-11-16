<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail, ContestPhase, ContestProblem } from '@/api/types/contests';
import { CUE_ROW, CUE_TABLE_ROW } from '@/components/ui/cue-tones';
import type { CueTone } from '@/components/ui/cue-tones';
import Card from '@/components/ui/Card.vue';
import PageSection from '@/components/ui/PageSection.vue';
import FactLine from '@/components/FactLine.vue';
import InlineBit from '@/components/InlineBit.vue';
import { formatNumber, formatPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import OwnResultChip from './OwnResultChip.vue';
import { limitsText } from './contest-limits';
import { attemptsLeftUnderCap, ownResultContext, ownResultTone, solvedSummary } from './own-result';

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
const hasOwnResults = computed(() =>
  problems.value.some((problem) => problem.viewerResult !== null),
);
/** The "Giới hạn" column shows only when the viewer sees a limit on some problem (else every cell is a dash). */
const hasLimits = computed(() => problems.value.some(hasLimit));
const context = computed(() => ownResultContext(props.contest, locale.locale));
const solvedCounts = computed(() => solvedSummary(problems.value));
const isCrowned = computed(() => props.contest.phase === 'ended' && solvedCounts.value.solved > 0);
/**
 * The attempt cap under the problem's name, with what the viewer has left once they have a result; null when the
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
/** A problem the viewer has a result on gets its row tint and edge: solved, partial or tried without points. */
const rowCueOf = (problem: ContestProblem, map: Record<CueTone, string>) => {
  const tone = ownResultTone(problem, context.value);
  return tone ? map[tone] : '';
};
const capLines = computed(
  () => new Map(problems.value.map((problem) => [problem.problemId, capLineOf(problem)])),
);
/** A phone row's meta: code, attempt cap, limits; each a whole fact (the points sit right of the row). */
const phoneFacts = (problem: ContestProblem) =>
  [
    problem.code,
    capLines.value.get(problem.problemId),
    hasLimit(problem) ? limitsText(problem) : null,
  ].filter((fact): fact is string => Boolean(fact));
</script>

<template>
  <Card v-if="!contest.problems" data-testid="contest-problems">
    <p class="px-5 py-8 text-center text-muted">{{ $t(HIDDEN_KEYS[contest.phase]) }}</p>
  </Card>
  <PageSection v-else :title="$t('contests.problems.heading')" :count="problems.length">
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
      <table class="hidden w-full border-collapse md:table">
        <caption class="sr-only">
          {{
            $t('contests.problems.caption')
          }}
        </caption>
        <thead>
          <tr class="text-left text-meta text-muted">
            <th scope="col" class="px-5 py-3 font-semibold">
              {{ $t('contests.problems.columns.label') }}
            </th>
            <th scope="col" class="px-3 py-2 font-semibold">
              {{ $t('contests.problems.columns.name') }}
            </th>
            <th v-if="hasLimits" scope="col" class="px-3 py-2 font-semibold whitespace-nowrap">
              {{ $t('problemSwitcher.limitsColumn') }}
            </th>
            <th scope="col" class="px-3 py-2 text-right font-semibold">
              {{ $t('contests.problems.columns.points') }}
            </th>
            <th v-if="hasOwnResults" scope="col" class="px-3 py-2 font-semibold whitespace-nowrap">
              {{ $t('contests.problems.columns.own') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="problem in contest.problems"
            :key="problem.problemId"
            class="relative border-t border-line hover:bg-surface-hover"
            :class="rowCueOf(problem, CUE_TABLE_ROW)"
          >
            <th scope="row" class="px-5 py-2 text-left font-display text-section font-bold">
              {{ problem.label }}
            </th>
            <td class="w-full max-w-0 min-w-28 px-3 py-2">
              <RouterLink
                :to="problemLink(problem)"
                :title="problem.name"
                class="block truncate font-semibold after:absolute after:inset-0 hover:text-accent-text"
                >{{ problem.name }}</RouterLink
              >
              <span :title="problem.code" class="block truncate font-mono text-caption text-muted">
                {{ problem.code }}
              </span>
              <span v-if="capLines.get(problem.problemId)" class="block text-caption text-muted">
                {{ capLines.get(problem.problemId) }}
              </span>
            </td>
            <td
              v-if="hasLimits"
              class="px-3 py-2 font-mono text-meta whitespace-nowrap tabular-nums"
            >
              {{ hasLimit(problem) ? limitsText(problem) : '' }}
            </td>
            <td class="px-3 py-2 text-right font-mono whitespace-nowrap tabular-nums">
              {{ pointsOf(problem) }}
            </td>
            <td v-if="hasOwnResults" class="max-w-40 px-3 py-2 xl:max-w-none">
              <OwnResultChip :problem="problem" :context="context" />
            </td>
          </tr>
        </tbody>
      </table>
      <ul class="m-0 list-none p-0 md:hidden">
        <li
          v-for="problem in contest.problems"
          :key="problem.problemId"
          class="relative flex min-h-14 items-center gap-3 border-t border-line px-3.5 py-3 first:border-t-0"
          :class="rowCueOf(problem, CUE_ROW)"
        >
          <span class="w-7 font-display text-section font-bold" aria-hidden="true">
            {{ problem.label }}
          </span>
          <div class="min-w-0 flex-1">
            <RouterLink
              :to="problemLink(problem)"
              class="flex min-h-9 min-w-0 items-center font-semibold after:absolute after:inset-0"
              ><span class="sr-only">{{ problem.label }}. </span
              ><span class="line-clamp-2">{{ problem.name }}</span></RouterLink
            >
            <FactLine class="font-mono text-caption text-muted" :facts="phoneFacts(problem)" />
          </div>
          <span class="font-mono text-meta tabular-nums">{{ pointsOf(problem) }}</span>
          <OwnResultChip v-if="hasOwnResults" :problem="problem" :context="context" />
        </li>
      </ul>
    </Card>
  </PageSection>
</template>
