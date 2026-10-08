<script setup lang="ts">
import { computed } from 'vue';
import type { Ranking, RankingRow } from '@/api/types/contests';
import UserName from '@/components/UserName.vue';
import { formatNumber } from '@/lib/format';
import { formatCumtime, isPenaltyFormat, rankingCell, solvedCount } from '@/lib/ranking-cells';
import { useLocaleStore } from '@/stores/locale.store';
import RankingCell from './RankingCell.vue';

const props = defineProps<{
  ranking: Ranking;
  rows: RankingRow[];
  formatName: string;
  viewerId: string | null;
}>();
const locale = useLocaleStore();
const penalty = computed(() => isPenaltyFormat(props.formatName));
const cellsOf = (row: RankingRow) =>
  props.ranking.problems.map((problem) => ({
    problemId: problem.problemId,
    view: rankingCell(row.cells[problem.problemId], problem, row.participationId, props.formatName),
  }));
const LEGEND = [
  'ranking.legend.firstSolve',
  'ranking.legend.solved',
  'ranking.legend.failed',
  'ranking.legend.pending',
] as const;
</script>

<template>
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
          <th scope="col" class="px-2.5 py-4 font-medium">
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
            {{ penalty ? solvedCount(row) : formatNumber(row.score, locale.locale, 2) }}
          </td>
          <td>{{ formatCumtime(formatName, row.cumtime) }}</td>
          <RankingCell v-for="cell in cellsOf(row)" :key="cell.problemId" :view="cell.view" />
        </tr>
      </tbody>
    </table>
  </div>
  <ul
    v-if="penalty"
    class="flex flex-wrap gap-x-4.5 gap-y-2 border-t border-line px-5 py-3.5 text-[13px] text-muted"
  >
    <li v-for="key in LEGEND" :key="key">{{ $t(key) }}</li>
  </ul>
</template>
