<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    /** What the current level reads as ("Frosted", "60%"). */
    readout: string;
    help?: string;
    value: number;
    step: number;
    disabled?: boolean;
    /** Spoken in place of the number when the level has a name. */
    valueText?: string;
    min?: number;
    max?: number;
    /** Id of an extra description (a hint below the slot). */
    describedby?: string;
  }>(),
  { min: 0, max: 100, help: undefined, valueText: undefined, describedby: undefined },
);
const emit = defineEmits<{ input: [value: number]; commit: [] }>();
/**
 * The native range drawn with tokens: a 24 px accent thumb ringed in the ground colour on a 6 px line that fills with the
 * accent up to the thumb (`--fill`), muted when disabled. Spelled out in full because Tailwind finds a class only as written.
 */
const SLIDER =
  'mt-2 h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed ' +
  '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-pill [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-accent)_var(--fill),var(--color-line-control)_var(--fill))] ' +
  'disabled:[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-line-strong)_var(--fill),var(--color-line-control)_var(--fill))] ' +
  '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-pill [&::-moz-range-track]:bg-line-control [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-pill [&::-moz-range-progress]:bg-accent ' +
  'disabled:[&::-moz-range-progress]:bg-line-strong ' +
  '[&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-solid [&::-webkit-slider-thumb]:bg-accent ' +
  '[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface-solid [&::-moz-range-thumb]:bg-accent ' +
  'disabled:[&::-webkit-slider-thumb]:bg-line-strong disabled:[&::-moz-range-thumb]:bg-line-strong';
const fill = computed(() => `${((props.value - props.min) / (props.max - props.min)) * 100}%`);
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between">
      <label :for="id" class="font-semibold">{{ label }}</label>
      <span class="font-mono text-meta text-muted">{{ readout }}</span>
    </div>
    <p v-if="help" class="mt-1 text-meta text-muted">{{ help }}</p>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      :disabled="disabled"
      :aria-valuetext="valueText"
      :aria-describedby="describedby"
      :class="SLIDER"
      :style="{ '--fill': fill }"
      @input="emit('input', Number(($event.target as HTMLInputElement).value))"
      @change="emit('commit')"
    />
    <slot />
  </div>
</template>
