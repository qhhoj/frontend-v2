<script setup lang="ts">
import { Info, Star } from 'lucide-vue-next';
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Popover from '@/components/ui/Popover.vue';
import { TABLE_CELL_CLASSES } from './ranking-cell-classes';

/**
 * "Chú giải": what the board's cells mean, behind one button in the board's header row, so the board starts at once and
 * keeps its height. Penalty boards read tries (`+n`, `−n`, `?n`); points boards read scores. `freezeNote` says why
 * cells show "?" while the board is frozen.
 */
defineProps<{
  isPenalty: boolean;
  showsTime: boolean;
  hasVirtualRows: boolean;
  freezeNote?: string;
}>();
/** Each line shows a sample of the cell it explains, in the cell's own classes. */
const sample = (text: string, kind: keyof typeof TABLE_CELL_CLASSES) => ({ text, kind });
const PENALTY_LEGEND = [
  { key: 'ranking.legend.solved', ...sample('+1', 'solved') },
  { key: 'ranking.legend.failed', ...sample('−1', 'failed') },
  { key: 'ranking.legend.pending', ...sample('?1', 'pending') },
] as const;
const POINTS_LEGEND = [
  { key: 'ranking.legend.fullPoints', ...sample('100', 'solved') },
  { key: 'ranking.legend.partialPoints', ...sample('60', 'partial') },
  { key: 'ranking.legend.zeroPoints', ...sample('0', 'failed') },
  { key: 'ranking.legend.notAttempted', ...sample('', 'empty') },
] as const;
const popover = ref<InstanceType<typeof Popover>>();
const isOpen = ref(false);
</script>

<template>
  <AppButton
    tone="ghost"
    size="sm"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    data-testid="ranking-legend-button"
    @click="popover?.toggle($event)"
  >
    <template #icon><Info class="size-4" aria-hidden="true" /></template>
    {{ $t('ranking.legend.button') }}
  </AppButton>
  <Popover
    ref="popover"
    :label="$t('ranking.legend.button')"
    @show="isOpen = true"
    @hide="isOpen = false"
  >
    <ul
      data-testid="ranking-legend"
      class="flex w-72 max-w-full flex-col gap-2 text-meta text-secondary"
    >
      <li v-if="isPenalty || showsTime" class="flex items-center gap-1.5">
        <span
          data-testid="first-solve-swatch"
          class="relative inline-flex h-5 w-9 shrink-0 rounded-cell bg-verdict-ac-bg"
          ><Star class="absolute top-0.5 right-0.5 size-2.5 text-verdict-ac" aria-hidden="true"
        /></span>
        {{ $t(isPenalty ? 'ranking.legend.firstSolve' : 'ranking.legend.firstPoints') }}
      </li>
      <li
        v-for="item in isPenalty ? PENALTY_LEGEND : POINTS_LEGEND"
        :key="item.key"
        class="flex items-center gap-1.5"
      >
        <span
          aria-hidden="true"
          class="inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-cell font-mono text-sm font-semibold tabular-nums"
          :class="[TABLE_CELL_CLASSES[item.kind], item.kind === 'empty' && 'border border-line']"
          >{{ item.text }}</span
        >
        {{ $t(item.key) }}
      </li>
      <li v-if="hasVirtualRows">{{ $t('ranking.virtualLegend') }}</li>
      <li v-if="freezeNote" data-testid="ranking-legend-freeze" class="font-semibold text-content">
        {{ freezeNote }}
      </li>
    </ul>
  </Popover>
</template>
