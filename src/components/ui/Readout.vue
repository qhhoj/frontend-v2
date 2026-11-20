<script setup lang="ts">
/**
 * The plate (redesign "Sơn mài"): the one dark surface, in light and in dark mode (dark mode frames it gold-brown).
 * It shows only what the judge or the clock measured: verdict, score, tests, time, memory, countdown, rank. Lay its
 * `ReadoutCell`s out in the default slot. Kit parts inside (Lamp, VerdictChip, Gauge, TestSquares, ContestTimeline,
 * AppButton) take the plate's colours by themselves: the `readout` utility (styles.css) re-points the colour roles.
 */
defineOptions({ name: 'UiReadout' });
withDefaults(
  defineProps<{
    as?: string;
    /** Names the plate for screen readers ("Kết quả chấm"). */
    label?: string;
  }>(),
  { as: 'section', label: undefined },
);
</script>

<template>
  <component :is="as" :aria-label="label" class="readout px-6 py-4 touch:px-4">
    <slot />
  </component>
</template>
