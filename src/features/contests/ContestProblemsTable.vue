<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail, ContestPhase, ContestProblem } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import PageSection from '@/components/ui/PageSection.vue';
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
  query: { contest: props.contest.key },
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
/** The "Giới hạn" column shows only when the viewer sees a limit on some problem (else every cell is a dash). */
const hasLimits = computed(() => problems.value.some((problem) => limitsText(problem) !== '—'));
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
const capLines = computed(
  () => new Map(problems.value.map((problem) => [problem.problemId, capLineOf(problem)])),
);
/** A phone row's meta: code, attempt cap, limits, points; each a whole fact. */
const phoneFacts = (problem: ContestProblem) =>
  [
    problem.code,
    capLines.value.get(problem.problemId),
    limitsText(problem),
    t('contests.problems.pointsShort', { points: pointsOf(problem) }),
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
              {{ limitsText(problem) }}
            </td>
            <td class="px-3 py-2 text-right font-mono whitespace-nowrap tabular-nums">
              {{ $t('contests.problems.pointsShort', { points: pointsOf(problem) }) }}
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
          <OwnResultChip v-if="hasOwnResults" :problem="problem" :context="context" />
        </li>
      </ul>
    </Card>
  </PageSection>
</template>
