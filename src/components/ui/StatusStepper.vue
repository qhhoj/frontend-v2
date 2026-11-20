<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionStatus } from '@/api/types/submissions';
import Lamp from './Lamp.vue';

/**
 * A submission that is not final, drawn like a verdict (`VerdictChip`): lamps in the judging colour, then the current step's label.
 * Four lamps on one line (queued, processing: the judge took it, before the first test; running test k of n; verdict): done steps
 * are lit, the current one pulses (still under reduced motion), the rest are unlit rings. It shows only what the live status says,
 * so there is no compile step: the judge does not report one. `compact` is the one-line list row: one pulsing lamp and the label.
 */
const props = defineProps<{
  status: SubmissionStatus;
  /** The test being run (0 = not known yet). */
  test?: number;
  /** The test count, when the viewer may know it. */
  total?: number | null;
  compact?: boolean;
}>();

/** Dot index of the current step; the last dot (the verdict) is never current while the submission is pending. */
const STEP_OF_STATUS: Partial<Record<SubmissionStatus, number>> = { QU: 0, P: 1, G: 2 };
const STEP_COUNT = 4;
const current = computed(() => STEP_OF_STATUS[props.status] ?? 0);
const label = computed(() => {
  if (current.value === 0) return 'submission.step.queued';
  if (current.value === 1) return 'submission.step.processing';
  return props.test ? 'submission.step.running' : 'submission.step.grading';
});
/** Lamp index of each step shown: all four, or only the current one in a list row. */
const lamps = computed(() =>
  props.compact ? [current.value] : Array.from({ length: STEP_COUNT }, (unused, index) => index),
);
</script>

<template>
  <span
    class="inline-flex min-h-(--qh-chip) min-w-0 items-center gap-2 text-small text-verdict-pending"
  >
    <span aria-hidden="true" class="flex shrink-0 items-center gap-2">
      <Lamp
        v-for="index in lamps"
        :key="index"
        :tone="index > current ? 'none' : 'pending'"
        :still="index < current"
      />
    </span>
    <span class="truncate font-semibold">{{
      $t(label, { test: test ?? 0, total: total ?? '?' })
    }}</span>
  </span>
</template>
