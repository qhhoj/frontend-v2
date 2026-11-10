<script setup lang="ts" generic="T extends string">
import { RADIO_INPUT } from './choice-classes';

/**
 * One choice among a few, each with a one-line explanation: a fieldset of radio cards (whole card clickable, 44 px or
 * taller, the checked card framed in the accent). For short labels use `RadioGroup`; for long lists a select. The optional
 * `extra` slot (gets the `option`) adds a line under the description, such as a small preview; `legendHidden` hides the legend visually when a heading above already names the group.
 */
const model = defineModel<T>({ required: true });
defineProps<{
  legend: string;
  name: string;
  options: { value: T; label: string; description: string }[];
  legendHidden?: boolean;
}>();
</script>

<template>
  <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
    <legend class="mb-1.5 text-sm font-semibold" :class="{ 'sr-only': legendHidden }">
      {{ legend }}
    </legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="option in options"
        :key="option.value"
        :data-testid="`${name}-${option.value}`"
        class="flex min-h-11 cursor-pointer items-start gap-3 rounded-cell border px-3 py-2.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-surface-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
        :class="
          model === option.value ? 'border-accent' : 'border-line-control hover:bg-surface-hover'
        "
      >
        <input
          v-model="model"
          type="radio"
          :name="name"
          :value="option.value"
          :class="RADIO_INPUT"
        />
        <span class="flex min-w-0 flex-col">
          <span class="text-sm font-semibold">{{ option.label }}</span>
          <span class="text-sm text-muted">{{ option.description }}</span>
          <slot name="extra" :option="option" />
        </span>
      </label>
    </div>
  </fieldset>
</template>
