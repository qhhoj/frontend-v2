<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import type { Ranking, RankingRow } from '@/api/types/contests';
import UserName from '@/components/UserName.vue';
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
</script>

<template>
  <p aria-hidden="true" class="px-5 pt-3 text-[13px] text-muted md:hidden">
    {{ $t('ranking.scrollHint') }}
  </p>
  <div
    tabindex="0"
    role="region"
    :aria-label="$t('ranking.scrollRegion')"
    class="overflow-x-auto focus-visible:-outline-offset-2"
  >
    <table class="w-full min-w-[720px] border-collapse">
      <caption class="sr-only">
        {{
          $t('pages.ranking')
        }}
      </caption>
      <thead>
        <tr class="text-center text-[13px] text-muted">
          <th scope="col" class="px-5 py-4 text-left font-medium">
            {{ $t('ranking.columns.rank') }}
          </th>
          <th scope="col" class="px-2.5 py-4 text-left font-medium">
            {{ $t('ranking.columns.user') }}
          </th>
          <th scope="col" class="px-2.5 py-4 font-medium">
            {{ $t(penalty ? 'ranking.columns.solved' : 'ranking.columns.score') }}
          </th>
          <th v-if="showsCumtime(context.formatName)" scope="col" class="px-2.5 py-4 font-medium">
            {{ $t(penalty ? 'ranking.columns.penalty' : 'ranking.columns.time') }}
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
          <td class="px-5 py-2.5 text-left">{{ row.rank ?? '—' }}</td>
          <th scope="row" class="px-2.5 py-2.5 text-left font-body">
            <UserName :username="row.user.username" />
            <span
              v-if="row.user.id === viewerId"
              class="ml-1.5 rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] text-accent-soft-text"
              >{{ $t('common.you') }}</span
            >
            <span
              v-if="row.isDisqualified"
              class="ml-1.5 rounded-pill bg-verdict-wa-bg px-2 py-0.5 text-[11px] text-verdict-wa"
              >{{ $t('ranking.disqualified') }}</span
            >
          </th>
          <td class="font-bold">
            {{
              penalty
                ? solvedCount(row, ranking.problems, context)
                : formatNumber(row.score, context.locale, context.pointsPrecision)
            }}
          </td>
          <td v-if="showsCumtime(context.formatName)">
            {{ formatCumtime(context.formatName, row.cumtime) }}
          </td>
          <RankingCell v-for="cell in cellsOf(row)" :key="cell.problemId" :view="cell.view" />
        </tr>
      </tbody>
    </table>
  </div>
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
</template>
