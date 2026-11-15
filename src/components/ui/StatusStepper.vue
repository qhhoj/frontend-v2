<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionStatus } from '@/api/types/submissions';

/**
 * The steps of a submission that is not final, as dots on one line with the current step's label: queued, processing
 * (the judge took it, before the first test), running test k of n, verdict. Done dots are filled and the current one
 * pulses (static under reduced motion). It shows only what the live status says, so there is no compile step: the judge
 * does not report one. It stands in for the verdict chip until the verdict arrives; `compact` is the one-line list row.
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
const dotClass = (index: number) => {
  if (index < current.value) return 'bg-verdict-pending';
  if (index === current.value) return 'bg-verdict-pending skeleton-pulse';
  return 'bg-line-strong';
};
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2" :class="compact ? 'text-tiny' : 'text-sm'">
    <span
      aria-hidden="true"
      class="flex shrink-0 items-center"
      :class="compact ? 'gap-1' : 'gap-1.5'"
    >
      <span
        v-for="index in STEP_COUNT"
        :key="index"
        class="rounded-pill transition-colors"
        :class="[compact ? 'size-1.5' : 'size-2', dotClass(index - 1)]"
      />
    </span>
    <span class="truncate font-medium text-verdict-pending">{{
      $t(label, { test: test ?? 0, total: total ?? '?' })
    }}</span>
  </span>
</template>
