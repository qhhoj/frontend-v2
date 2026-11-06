<script setup lang="ts">
import { computed } from 'vue';

/** `positive`/`negative` are the old names of `success`/`danger`. */
export type ProgressTone = 'accent' | 'success' | 'warning' | 'danger' | 'positive' | 'negative';

const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    tone?: ProgressTone;
    /** What is measured; read out by screen readers. */
    label: string;
  }>(),
  { max: 100, tone: 'accent' },
);

const FILLS: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  success: 'bg-positive',
  warning: 'bg-warning',
  danger: 'bg-negative',
  positive: 'bg-positive',
  negative: 'bg-negative',
};

const clampedValue = computed(() => Math.min(Math.max(props.value, 0), Math.max(props.max, 0)));
const fillPercent = computed(() => (props.max > 0 ? (clampedValue.value / props.max) * 100 : 0));
</script>

<template>
  <div
    role="progressbar"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="clampedValue"
    :aria-label="label"
    class="h-2 overflow-hidden rounded-pill bg-surface-strong"
  >
    <div class="h-full rounded-pill" :class="FILLS[tone]" :style="{ width: `${fillPercent}%` }" />
  </div>
</template>
