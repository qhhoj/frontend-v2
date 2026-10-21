<script setup lang="ts">
import type { ShownStep, StepStatus } from '../import/import-steps';

/**
 * One segment per step (option B), coloured by its status; `attention` marks the end amber (imported, a file step after
 * the write failed). Decorative: the header says the same in words, the step list behind "Chi tiết các bước" in full.
 */
defineProps<{ steps: ShownStep[]; attention?: boolean }>();
const FILLS: Record<StepStatus, string> = {
  done: 'bg-positive',
  current: 'bg-accent',
  failed: 'bg-negative',
  pending: 'bg-surface-strong',
};
const fillOf = (step: ShownStep, attention: boolean) =>
  attention && step.key === 'end' ? 'bg-warning' : FILLS[step.status];
</script>

<template>
  <div aria-hidden="true" class="flex gap-1" data-testid="import-step-bar">
    <span
      v-for="step in steps"
      :key="step.key"
      class="h-1.5 flex-1 rounded-pill"
      :class="fillOf(step, attention)"
      :data-status="step.status"
    />
  </div>
</template>
