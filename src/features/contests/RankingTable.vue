<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import UserLink from '@/components/UserLink.vue';
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import { Star } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { focusTableRow } from '@/lib/focus-table-row';
import { medalClass } from '@/lib/medal';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import type { Ranking, RankingProblem, RankingRow } from '@/api/types/contests';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { deltaToneClass, formatDelta } from '@/lib/rating-delta';
import {
  formatCumtime,
  isPenaltyFormat,
  rankingCell,
  showsCumtime,
  solvedCount,
  totalScoreText,
} from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import RankingCell from './RankingCell.vue';
import RankingProblemHeader from './RankingProblemHeader.vue';
import {
  PROBLEM_COLUMN_REM,
  RANK_COLUMN_REM,
  RATING_COLUMN_REM,
  SCORE_COLUMN_REM,
  TIME_COLUMN_REM,
  tableMinWidthRem,
} from './ranking-columns';

const props = defineProps<{
  ranking: Ranking;
  rows: RankingRow[];
  context: RankingContext;
  viewerId: string | null;
  /** Cells link to the contest's submissions of that user and problem; absent on boards that cannot (replay). */
  contestKey?: string;
  /** The viewer may only see own submissions (backend narrows the list), so only their own row links. */
  ownSubmissionsOnly?: boolean;
}>();
const penalty = computed(() => isPenaltyFormat(props.context.formatName));
const root = ref<HTMLElement | null>(null);
const isMotionAllowed = useMotionAllowed();
/** Focuses a participation's name cell ("Về hàng của tôi"); false when the row is not shown. */
const focusRow = (participationId: string) =>
  focusTableRow(root.value, participationId, isMotionAllowed.value);
defineExpose({ focusRow });
const hasVirtualRows = computed(() => props.rows.some((row) => row.virtual > 0));
const cellsOf = (row: RankingRow) =>
  props.ranking.problems.map((problem) => ({
    problemId: problem.problemId,
    to: submissionsLink(row, problem),
    view: rankingCell(row.cells[problem.problemId], problem, row.participationId, props.context),
  }));
/** Contest submissions of one user (and problem); undefined where the viewer may not see them. */
const submissionsLink = (row: RankingRow, problem?: RankingProblem) => {
  if (!props.contestKey) return undefined;
  if (props.ownSubmissionsOnly && row.user.id !== props.viewerId) return undefined;
  return {
    name: 'contest-submissions',
    params: { key: props.contestKey },
    query: { user: row.user.username, problem: problem?.code },
  };
};
const LEGEND = [
  'ranking.legend.solved',
  'ranking.legend.failed',
  'ranking.legend.pending',
] as const;
const POINTS_LEGEND = [
  'ranking.legend.fullPoints',
  'ranking.legend.partialPoints',
  'ranking.legend.zeroPoints',
  'ranking.legend.notAttempted',
] as const;
/** Points boards put the cumulative time under the score; penalty boards keep Solved and Penalty. */
const hasCombinedScore = computed(
  () => !penalty.value && props.context.showsTime && showsCumtime(props.context.formatName),
);
const hasTimeColumn = computed(() => penalty.value && showsCumtime(props.context.formatName));
/** Rated contests carry each row's rating change once the ratings are applied. */
const hasRatingColumn = computed(() => props.ranking.rows.some((row) => row.ratingChange));
const minWidth = computed(
  () =>
    `${tableMinWidthRem(props.ranking.problems.length, hasTimeColumn.value) + (hasRatingColumn.value ? RATING_COLUMN_REM : 0)}rem`,
);
const scoreHeaderKey = computed(() => {
  if (penalty.value) return 'ranking.columns.solved';
  return hasCombinedScore.value ? 'ranking.columns.scoreTime' : 'ranking.columns.score';
});
</script>

<template>
  <div ref="root" class="contents">
    <ScrollRegion :label="$t('ranking.scrollRegion')" :hint="$t('ranking.scrollHint')">
      <table class="w-full table-fixed border-collapse" :style="{ minWidth }">
        <colgroup>
          <col :style="{ width: `${RANK_COLUMN_REM}rem` }" />
          <col />
          <col :style="{ width: `${SCORE_COLUMN_REM}rem` }" />
          <col v-if="hasTimeColumn" :style="{ width: `${TIME_COLUMN_REM}rem` }" />
          <col v-if="hasRatingColumn" :style="{ width: `${RATING_COLUMN_REM}rem` }" />
          <col
            v-for="problem in ranking.problems"
            :key="problem.problemId"
            :style="{ width: `${PROBLEM_COLUMN_REM}rem` }"
          />
        </colgroup>
        <caption class="sr-only">
          {{
            $t('pages.ranking')
          }}
        </caption>
        <thead>
          <tr class="text-center text-meta text-muted">
            <th scope="col" class="w-14 px-3 py-4 text-right font-medium">
              <RankColumnHeader :label="$t('ranking.columns.rank')" />
            </th>
            <th scope="col" class="px-2.5 py-4 text-left font-medium">
              {{ $t('ranking.columns.user') }}
            </th>
            <th scope="col" class="px-2.5 py-4 font-medium">
              {{ $t(scoreHeaderKey) }}
            </th>
            <th v-if="hasTimeColumn" scope="col" class="px-2.5 py-4 font-medium">
              {{ $t('ranking.columns.penalty') }}
            </th>
            <th v-if="hasRatingColumn" scope="col" class="px-2.5 py-4 font-medium">
              {{ $t('ranking.columns.ratingChange') }}
            </th>
            <th
              v-for="problem in ranking.problems"
              :key="problem.problemId"
              scope="col"
              class="px-1.5 py-4 font-bold text-content"
            >
              <RankingProblemHeader :problem="problem" />
            </th>
          </tr>
        </thead>
        <tbody class="font-mono text-sm tabular-nums">
          <tr
            v-for="row in rows"
            :key="row.participationId"
            :data-row-id="row.participationId"
            class="border-t border-line text-center"
            :class="{ 'bg-surface-hover': row.user.id === viewerId }"
          >
            <td
              class="w-14 px-3 py-2.5 text-right"
              :class="row.rank && !row.isDisqualified ? medalClass(row.rank) : ''"
            >
              {{ row.isDisqualified ? '—' : (row.rank ?? '—') }}
            </td>
            <th scope="row" tabindex="-1" class="overflow-hidden px-2.5 py-2.5 text-left font-body">
              <span class="flex items-center gap-2">
                <UserLink
                  :username="row.user.username"
                  :rating="row.user.rating"
                  :to="submissionsLink(row)"
                />
                <Chip v-if="row.virtual > 0">{{ $t('ranking.virtual') }}</Chip>
                <Chip v-if="row.user.id === viewerId" tone="accent">{{ $t('common.you') }}</Chip>
                <Chip v-if="row.isDisqualified" tone="danger">{{
                  $t('ranking.disqualified')
                }}</Chip>
              </span>
            </th>
            <td class="font-bold">
              <template v-if="row.isDisqualified">—</template>
              <template v-else>{{
                penalty
                  ? solvedCount(row, ranking.problems, context)
                  : totalScoreText(row.score, ranking.problems, context)
              }}</template>
              <small
                v-if="hasCombinedScore && !row.isDisqualified"
                class="block text-tiny font-medium text-muted"
                >{{ formatCumtime(context.formatName, row.cumtime, context.locale) }}</small
              >
            </td>
            <td v-if="hasTimeColumn">
              {{
                row.isDisqualified
                  ? '—'
                  : formatCumtime(context.formatName, row.cumtime, context.locale)
              }}
            </td>
            <td
              v-if="hasRatingColumn"
              data-testid="rating-change"
              class="px-2.5 whitespace-nowrap"
              :class="deltaToneClass(row.ratingChange?.delta ?? null)"
            >
              <template v-if="!row.ratingChange">—</template>
              <template v-else-if="row.ratingChange.delta === null">{{
                row.ratingChange.rating
              }}</template>
              <template v-else
                >{{ formatDelta(row.ratingChange.delta) }} → {{ row.ratingChange.rating }}</template
              >
            </td>
            <RankingCell
              v-for="cell in cellsOf(row)"
              :key="cell.problemId"
              :view="cell.view"
              :to="cell.to"
            />
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
    <p
      v-if="!rows.length && ranking.rows.length"
      role="status"
      data-testid="ranking-no-match"
      class="border-t border-line px-5 py-6 text-center text-muted"
    >
      {{ $t('ranking.noMatch') }}
    </p>
    <ul
      v-if="penalty"
      class="flex flex-wrap gap-x-4.5 gap-y-2 border-t border-line px-5 py-3.5 text-meta text-muted"
    >
      <li class="flex items-center gap-1.5">
        <span
          data-testid="first-solve-swatch"
          class="inline-flex size-5 items-center justify-center rounded-cell bg-first-solve text-first-solve-text"
          ><Star class="size-3"
        /></span>
        {{ $t('ranking.legend.firstSolve') }}
      </li>
      <li v-for="key in LEGEND" :key="key">{{ $t(key) }}</li>
      <li v-if="hasVirtualRows">{{ $t('ranking.virtualLegend') }}</li>
    </ul>
    <ul
      v-else
      class="flex flex-wrap gap-x-4.5 gap-y-2 border-t border-line px-5 py-3.5 text-meta text-muted"
    >
      <li v-if="context.showsTime" class="flex items-center gap-1.5">
        <span
          class="inline-flex size-5 items-center justify-center rounded-cell bg-first-solve text-first-solve-text"
          ><Star class="size-3" aria-hidden="true"
        /></span>
        {{ $t('ranking.legend.firstPoints') }}
      </li>
      <li v-for="key in POINTS_LEGEND" :key="key">{{ $t(key) }}</li>
      <li v-if="hasVirtualRows">{{ $t('ranking.virtualLegend') }}</li>
    </ul>
  </div>
</template>
