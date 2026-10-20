<script setup lang="ts" generic="Value extends string">
import { CHECK_CHIP } from './controls';

export interface CheckChipOption<V extends string = string> {
  value: V;
  /** What shows (a verdict code, a language name). */
  label: string;
  /** The full name: tooltip and what a screen reader reads after the label. */
  title?: string;
}

/** Checkbox pills for a multi-pick filter (verdicts, languages, statuses). `mono` sets codes in the mono face; `#label` draws a label of its own. */
defineProps<{ options: readonly CheckChipOption<Value>[]; name: string; mono?: boolean }>();
const picked = defineModel<Value[]>({ required: true });
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <label
      v-for="option in options"
      :key="option.value"
      :class="[CHECK_CHIP, 'cursor-pointer']"
      :title="option.title"
    >
      <input v-model="picked" type="checkbox" :name="name" :value="option.value" />
      <slot name="label" :option="option">
        <span :class="mono && 'font-mono'">{{ option.label }}</span>
      </slot>
      <span v-if="option.title" class="sr-only">{{ option.title }}</span>
    </label>
  </div>
</template>
