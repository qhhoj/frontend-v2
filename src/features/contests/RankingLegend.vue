<script setup lang="ts">
import { Info, Star } from 'lucide-vue-next';
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Popover from '@/components/ui/Popover.vue';

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
const PENALTY_LEGEND = [
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
          class="inline-flex size-5 shrink-0 items-center justify-center rounded-cell bg-first-solve text-first-solve-text"
          ><Star class="size-3" aria-hidden="true"
        /></span>
        {{ $t(isPenalty ? 'ranking.legend.firstSolve' : 'ranking.legend.firstPoints') }}
      </li>
      <li v-for="key in isPenalty ? PENALTY_LEGEND : POINTS_LEGEND" :key="key">{{ $t(key) }}</li>
      <li v-if="hasVirtualRows">{{ $t('ranking.virtualLegend') }}</li>
      <li v-if="freezeNote" data-testid="ranking-legend-freeze" class="font-semibold text-content">
        {{ freezeNote }}
      </li>
    </ul>
  </Popover>
</template>
