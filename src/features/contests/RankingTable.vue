<script setup lang="ts">
import UserLink from '@/components/UserLink.vue';
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import { medalClass } from '@/lib/medal';
import type { Ranking, RankingRow } from '@/api/types/contests';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { formatNumber } from '@/lib/format';
import {
  formatCumtime,
  isPenaltyFormat,
  rankingCell,
  showsCumtime,
  solvedCount,
} from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import RankingCell from './RankingCell.vue';
import {
  PROBLEM_COLUMN_REM,
  RANK_COLUMN_REM,
  SCORE_COLUMN_REM,
  TIME_COLUMN_REM,
  tableMinWidthRem,
} from './ranking-columns';

const props = defineProps<{
  ranking: Ranking;
  rows: RankingRow[];
  context: RankingContext;
  viewerId: string | null;
}>();
const penalty = computed(() => isPenaltyFormat(props.context.formatName));
const cellsOf = (row: RankingRow) =>
  props.ranking.problems.map((problem) => ({
    problemId: problem.problemId,
    view: rankingCell(row.cells[problem.problemId], problem, row.participationId, props.context),
  }));
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
/** Points boards put the cumulative time under the score (Cells A); penalty boards keep Solved and Penalty. */
const hasCombinedScore = computed(
  () => !penalty.value && props.context.showsTime && showsCumtime(props.context.formatName),
);
const hasTimeColumn = computed(() => penalty.value && showsCumtime(props.context.formatName));
const minWidth = computed(
  () => `${tableMinWidthRem(props.ranking.problems.length, hasTimeColumn.value)}rem`,
);
const scoreHeaderKey = computed(() => {
  if (penalty.value) return 'ranking.columns.solved';
  return hasCombinedScore.value ? 'ranking.columns.scoreTime' : 'ranking.columns.score';
});
</script>

<template>
  <ScrollRegion :label="$t('ranking.scrollRegion')" :hint="$t('ranking.scrollHint')">
    <table class="w-full table-fixed border-collapse" :style="{ minWidth }">
      <colgroup>
        <col :style="{ width: `${RANK_COLUMN_REM}rem` }" />
        <col />
        <col :style="{ width: `${SCORE_COLUMN_REM}rem` }" />
        <col v-if="hasTimeColumn" :style="{ width: `${TIME_COLUMN_REM}rem` }" />
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
        <tr class="text-center text-[13px] text-muted">
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
          <th
            v-for="problem in ranking.problems"
            :key="problem.problemId"
            scope="col"
            class="px-1.5 py-4 font-bold text-content"
          >
            <abbr :title="problem.code" class="no-underline">{{ problem.label }}</abbr>
          </th>
        </tr>
      </thead>
      <tbody class="font-mono text-sm tabular-nums">
        <tr
          v-for="row in rows"
          :key="row.participationId"
          class="border-t border-line text-center"
          :class="{ 'bg-surface-hover': row.user.id === viewerId }"
        >
          <td
            class="w-14 px-3 py-2.5 text-right"
            :class="row.rank && !row.isDisqualified ? medalClass(row.rank) : ''"
          >
            {{ row.isDisqualified ? '—' : (row.rank ?? '—') }}
          </td>
          <th scope="row" class="overflow-hidden px-2.5 py-2.5 text-left font-body">
            <span class="flex items-center gap-2">
              <UserLink :username="row.user.username" :rating="row.user.rating" />
              <span
                v-if="row.user.id === viewerId"
                class="shrink-0 rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] text-accent-soft-text"
                >{{ $t('common.you') }}</span
              >
              <span
                v-if="row.isDisqualified"
                class="shrink-0 rounded-pill bg-verdict-wa-bg px-2 py-0.5 text-[11px] text-verdict-wa"
                >{{ $t('ranking.disqualified') }}</span
              >
            </span>
          </th>
          <td class="font-bold">
            <template v-if="row.isDisqualified">—</template>
            <template v-else>{{
              penalty
                ? solvedCount(row, ranking.problems, context)
                : formatNumber(row.score, context.locale, context.pointsPrecision)
            }}</template>
            <small
              v-if="hasCombinedScore && !row.isDisqualified"
              class="block text-[11px] font-medium text-muted"
              >{{ formatCumtime(context.formatName, row.cumtime) }}</small
            >
          </td>
          <td v-if="hasTimeColumn">
            {{ row.isDisqualified ? '—' : formatCumtime(context.formatName, row.cumtime) }}
          </td>
          <RankingCell v-for="cell in cellsOf(row)" :key="cell.problemId" :view="cell.view" />
        </tr>
      </tbody>
    </table>
  </ScrollRegion>
  <ul
    v-if="penalty"
    class="flex flex-wrap gap-x-4.5 gap-y-2 border-t border-line px-5 py-3.5 text-[13px] text-muted"
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
  </ul>
  <ul
    v-else
    class="flex flex-wrap gap-x-4.5 gap-y-2 border-t border-line px-5 py-3.5 text-[13px] text-muted"
  >
    <li v-if="context.showsTime" class="flex items-center gap-1.5">
      <span
        class="inline-flex size-5 items-center justify-center rounded-cell bg-first-solve text-first-solve-text"
        ><Star class="size-3" aria-hidden="true"
      /></span>
      {{ $t('ranking.legend.firstPoints') }}
    </li>
    <li v-for="key in POINTS_LEGEND" :key="key">{{ $t(key) }}</li>
  </ul>
</template>
