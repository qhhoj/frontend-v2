<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ListStep } from './problem-setup-marks';

/**
 * A problem's setup as four segments in order (information, statement, tests and judging, trial run): a done step is
 * filled in the success colour, an open one is the line colour. The steps are named, with their state, in the tooltip and
 * for screen readers; the row's next-step link says what to do.
 */
const props = defineProps<{ steps: readonly ListStep[] }>();
const { t } = useI18n();
const summary = computed(() =>
  props.steps
    .map((step) =>
      t(`admin.problemList.setup.${step.isDone ? 'stepDone' : 'stepOpen'}`, {
        step: t(`admin.problemList.setup.steps.${step.id}`),
      }),
    )
    .join(' · '),
);
</script>

<template>
  <span role="img" :aria-label="summary" :title="summary" class="inline-flex gap-1 align-middle">
    <span
      v-for="step in steps"
      :key="step.id"
      class="h-2 w-4 rounded-mark"
      :class="step.isDone ? 'bg-positive' : 'bg-line-strong'"
    />
  </span>
</template>
