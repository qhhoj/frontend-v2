<script setup lang="ts" generic="T extends string | number">
import { CHOICE_ROW, RADIO_INPUT } from './choice-classes';

/**
 * One choice among a few short options: a fieldset of radios, each in a 44 px row on touch. Options carry an optional
 * one-line `description`; `inline` lays them side by side. For options that need a sentence each, use `ChoiceCards`.
 * `legend` names the group (visually hidden with `legendHidden`).
 */
/** Null while nothing is chosen. */
const model = defineModel<T | null>({ required: true });
defineProps<{
  legend: string;
  name: string;
  options: { value: T; label: string; description?: string; disabled?: boolean }[];
  inline?: boolean;
  legendHidden?: boolean;
}>();
</script>

<template>
  <fieldset class="m-0 min-w-0 border-0 p-0">
    <legend class="mb-1.5 text-sm font-semibold" :class="{ 'sr-only': legendHidden }">
      {{ legend }}
    </legend>
    <div class="flex gap-x-6 gap-y-1" :class="inline ? 'flex-row flex-wrap' : 'flex-col'">
      <label
        v-for="option in options"
        :key="option.value"
        :data-testid="`${name}-${option.value}`"
        :class="[CHOICE_ROW, option.disabled ? 'cursor-not-allowed' : 'cursor-pointer']"
      >
        <input
          v-model="model"
          type="radio"
          :name="name"
          :value="option.value"
          :class="RADIO_INPUT"
          :aria-disabled="option.disabled ? 'true' : undefined"
          @click="option.disabled && $event.preventDefault()"
        />
        <span class="flex min-w-0 flex-col">
          <span class="text-sm font-semibold" :class="{ 'text-muted': option.disabled }">{{
            option.label
          }}</span>
          <span v-if="option.description" class="text-meta text-muted">{{
            option.description
          }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
