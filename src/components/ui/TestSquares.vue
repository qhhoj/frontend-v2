<script setup lang="ts">
import type { VerdictTone } from '@/lib/verdicts';
import { VERDICT_MARK_CLASSES } from '@/lib/verdicts';

/** One test: its verdict tone, or `waiting` while the judge has not reached it; `label` is read out and shown on hover ("Test 8: quá thời gian"). */
export interface TestSquare {
  tone: VerdictTone | 'waiting';
  label: string;
  /** The number in the square; its place in the list (from 1) when absent. */
  number?: number;
}

/**
 * The tests of one submission as numbered squares in verdict colours, in judging order. While judging, the squares
 * not reached yet are `waiting` (grey) and light up as verdicts arrive; the colour change is the only motion.
 * Made for a `Readout`; on a page each square is the verdict's solid with its label colour.
 */
defineOptions({ name: 'UiTestSquares' });
defineProps<{
  tests: readonly TestSquare[];
  /** Names the list ("Kết quả từng test"). */
  label: string;
}>();
</script>

<template>
  <ol :aria-label="label" class="m-0 flex list-none flex-wrap gap-1 p-0">
    <li
      v-for="(test, index) in tests"
      :key="index"
      :title="test.label"
      class="inline-flex size-5.5 items-center justify-center rounded-cell font-mono text-kbd leading-none transition-colors"
      :class="
        test.tone === 'waiting'
          ? 'bg-surface-strong text-content'
          : [VERDICT_MARK_CLASSES[test.tone], 'font-bold']
      "
    >
      <span aria-hidden="true">{{ test.number ?? index + 1 }}</span>
      <span class="sr-only">{{ test.label }}</span>
    </li>
  </ol>
</template>
