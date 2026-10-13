<script setup lang="ts">
withDefaults(
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
      class="mt-2 h-11 w-full accent-accent disabled:cursor-not-allowed"
      @input="emit('input', Number(($event.target as HTMLInputElement).value))"
      @change="emit('commit')"
    />
    <slot />
  </div>
</template>
