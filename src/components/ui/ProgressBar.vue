<script setup lang="ts">
import { computed } from 'vue';

/**
 * A share of a whole as one bar. `neutral` is for a number that measures the thing, not the viewer (an AC rate, how many solved a
 * problem): it carries no verdict or status colour. `size="sm"` is the 4 px bar of a table cell; give it a width class. Beside a
 * number that already says the value, pass `aria-hidden="true"` so it is not read twice.
 * `positive`/`negative` are the old names of `success`/`danger`.
 */
export type ProgressTone =
  'accent' | 'neutral' | 'live' | 'success' | 'warning' | 'danger' | 'positive' | 'negative';

const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    tone?: ProgressTone;
    size?: 'sm' | 'md';
    /** What is measured; read out by screen readers. */
    label: string;
  }>(),
  { max: 100, tone: 'accent', size: 'md' },
);

const FILLS: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  neutral: 'bg-muted',
  live: 'bg-cue-live',
  success: 'bg-positive',
  warning: 'bg-warning',
  danger: 'bg-negative',
  positive: 'bg-positive',
  negative: 'bg-negative',
};

const HEIGHTS = { sm: 'h-1', md: 'h-2' };

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
    class="overflow-hidden rounded-pill bg-surface-strong"
    :class="HEIGHTS[size]"
  >
    <div class="h-full rounded-pill" :class="FILLS[tone]" :style="{ width: `${fillPercent}%` }" />
  </div>
</template>
