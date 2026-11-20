<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { TABLE_CELL_CLASSES } from './ranking-cell-classes';

/**
 * What the board's cells mean, on one line above the board: a sample of each cell in the cell's own classes, then its
 * word. Penalty boards read tries (`+n`, `−n`, `?n`); points boards read scores. `freezeNote` says why cells show "?"
 * while the board is frozen.
 */
defineProps<{
  isPenalty: boolean;
  showsTime: boolean;
  hasVirtualRows: boolean;
  freezeNote?: string;
}>();
const sample = (text: string, kind: keyof typeof TABLE_CELL_CLASSES) => ({ text, kind });
const PENALTY_LEGEND = [
  { key: 'ranking.legend.solved', ...sample('+1', 'solved') },
  { key: 'ranking.legend.failed', ...sample('−2', 'failed') },
  { key: 'ranking.legend.pending', ...sample('?1', 'pending') },
] as const;
const POINTS_LEGEND = [
  { key: 'ranking.legend.fullPoints', ...sample('100', 'solved') },
  { key: 'ranking.legend.partialPoints', ...sample('60', 'partial') },
  { key: 'ranking.legend.zeroPoints', ...sample('0', 'failed') },
  { key: 'ranking.legend.notAttempted', ...sample('—', 'empty') },
] as const;
const SAMPLE =
  'relative inline-flex h-6 min-w-9 shrink-0 items-center justify-center rounded-cell px-1 font-mono font-semibold tabular-nums';
</script>

<template>
  <ul
    data-testid="ranking-legend"
    :aria-label="$t('ranking.legend.label')"
    class="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-small text-muted"
  >
    <li
      v-for="item in isPenalty ? PENALTY_LEGEND : POINTS_LEGEND"
      :key="item.key"
      class="flex items-center gap-1.5"
    >
      <span aria-hidden="true" :class="[SAMPLE, TABLE_CELL_CLASSES[item.kind]]">{{
        item.text
      }}</span>
      {{ $t(item.key) }}
    </li>
    <li v-if="isPenalty || showsTime" class="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        data-testid="first-solve-swatch"
        :class="[SAMPLE, TABLE_CELL_CLASSES['first-solve']]"
        ><Star class="absolute top-0.5 right-0.5 size-2.5 fill-current text-merit"
      /></span>
      {{ $t('ranking.legend.firstSolve') }}
    </li>
    <li v-if="hasVirtualRows">{{ $t('ranking.virtualLegend') }}</li>
    <li v-if="freezeNote" data-testid="ranking-legend-freeze" class="font-semibold text-content">
      {{ freezeNote }}
    </li>
  </ul>
</template>
