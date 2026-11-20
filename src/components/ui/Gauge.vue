<script setup lang="ts">
import { computed } from 'vue';

/**
 * A measured value against its limit (time against the time limit, memory against the memory limit): a thin bar, with
 * optional scale labels under it ("0", "1,0 s"). `warn` paints the bar amber: the value is at or over the limit.
 * Made for a `Readout`, where it takes the plate's colours; on a page it is ink on a grey track.
 */
defineOptions({ name: 'UiGauge' });
const props = defineProps<{
  value: number;
  limit: number;
  /** What is measured; read out by screen readers. */
  label: string;
  /** The value in words ("0,42 s trên 1,0 s"), read out instead of the bare number. */
  valueText?: string;
  warn?: boolean;
  /** Labels under the bar, spread from its start to its end. */
  scale?: readonly string[];
}>();

const clampedValue = computed(() => Math.min(Math.max(props.value, 0), Math.max(props.limit, 0)));
const fillPercent = computed(() =>
  props.limit > 0 ? (clampedValue.value / props.limit) * 100 : 0,
);
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      role="meter"
      aria-valuemin="0"
      :aria-valuemax="limit"
      :aria-valuenow="clampedValue"
      :aria-valuetext="valueText"
      :aria-label="label"
      class="h-1.5 overflow-hidden rounded-pill bg-surface-strong"
    >
      <div
        class="h-full rounded-pill"
        :class="warn ? 'bg-warning' : 'bg-content'"
        :style="{ width: `${fillPercent}%` }"
      />
    </div>
    <div
      v-if="scale?.length"
      aria-hidden="true"
      class="flex justify-between font-mono text-kbd font-medium text-muted"
    >
      <span v-for="mark in scale" :key="mark">{{ mark }}</span>
    </div>
  </div>
</template>
