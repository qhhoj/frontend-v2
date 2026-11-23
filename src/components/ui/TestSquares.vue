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
  /** Each judged square becomes a real button that emits `select`; a `waiting` square stays plain. Off: plain items. */
  selectable?: boolean;
}>();
const emit = defineEmits<{ select: [test: TestSquare, index: number] }>();

/** A button keeps its look; on touch an invisible 44 px box (the `--qh-touch` token) centres on the square. */
const BUTTON_CLASS =
  'relative m-0 inline-flex size-full cursor-pointer items-center justify-center rounded-mark border-0 bg-transparent p-0 font-mono text-kbd leading-none text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus touch:after:absolute touch:after:top-1/2 touch:after:left-1/2 touch:after:size-(--qh-touch) touch:after:-translate-1/2';
</script>

<template>
  <ol :aria-label="label" class="m-0 flex list-none flex-wrap gap-1 p-0">
    <li
      v-for="(test, index) in tests"
      :key="index"
      :title="test.label"
      class="inline-flex size-5 items-center justify-center rounded-mark font-mono text-kbd leading-none transition-colors"
      :class="
        test.tone === 'waiting'
          ? 'bg-surface-strong text-content'
          : [VERDICT_MARK_CLASSES[test.tone], 'font-bold']
      "
    >
      <button
        v-if="selectable && test.tone !== 'waiting'"
        type="button"
        :class="[BUTTON_CLASS, 'font-bold']"
        @click="emit('select', test, index)"
      >
        <span aria-hidden="true">{{ test.number ?? index + 1 }}</span>
        <span class="sr-only">{{ test.label }}</span>
      </button>
      <template v-else>
        <span aria-hidden="true">{{ test.number ?? index + 1 }}</span>
        <span class="sr-only">{{ test.label }}</span>
      </template>
    </li>
  </ol>
</template>
