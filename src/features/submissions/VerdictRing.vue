<script setup lang="ts">
import { computed } from 'vue';
import type { RingProgress } from '@/lib/grading';
import { translate } from '@/i18n';

const props = defineProps<{ progress: RingProgress }>();
const FULL_TURN_DEGREES = 360;
const PERCENT = 100;

/** `positive` for the finished share, `line-strong` for the rest: tokens only, so every theme styles it. */
const ringStyle = computed(() => ({
  background: `conic-gradient(var(--qh-positive) ${props.progress.fraction * FULL_TURN_DEGREES}deg, var(--qh-line-strong) 0)`,
}));
const percent = computed(() => Math.round(props.progress.fraction * PERCENT));
const label = computed(() =>
  props.progress.mode === 'cases'
    ? translate('submission.ringLabel', {
        graded: props.progress.graded,
        total: props.progress.total,
      })
    : translate('submission.ringLabelPoints', { percent: percent.value }),
);
const centerText = computed(() =>
  props.progress.mode === 'cases'
    ? `${props.progress.graded}/${props.progress.total}`
    : `${percent.value}%`,
);
</script>

<template>
  <div
    role="img"
    :aria-label="label"
    :style="ringStyle"
    class="flex size-32 shrink-0 items-center justify-center rounded-full"
  >
    <span
      aria-hidden="true"
      class="flex size-24 items-center justify-center rounded-full bg-surface-solid font-mono text-lg font-semibold tabular-nums"
      >{{ centerText }}</span
    >
  </div>
</template>
