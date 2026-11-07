<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import { CHECKBOX_INPUT, CHOICE_ROW } from './choice-classes';

/**
 * A yes/no field of a form saved later (a switch is for settings that apply at once): the box, its label and an optional
 * one-line description, in one 44 px row on touch. Without `label` the box stands alone (a table cell, a bulk select) and
 * the caller names it with `aria-label`. `disabled` is the native attribute (it cannot toggle or submit) with the muted pair.
 */
defineOptions({ name: 'UiCheckbox', inheritAttrs: false });
const model = defineModel<boolean>({ required: true });
const props = withDefaults(
  defineProps<{ label?: string; description?: string; disabled?: boolean; inputId?: string }>(),
  { label: undefined, description: undefined, disabled: false, inputId: undefined },
);
const generatedId = useId();
const id = computed(() => props.inputId ?? generatedId);
</script>

<template>
  <!-- The whole row is the label, so the 44 px touch row clicks; a box without text grows 12 px of label padding (not an overlay, so it never covers a neighbour). -->
  <label
    :class="[
      CHOICE_ROW,
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      !label && 'touch:-m-3 touch:p-3',
    ]"
  >
    <span class="relative mt-0.5 inline-flex shrink-0 touch:mt-0">
      <input
        v-bind="$attrs"
        :id="id"
        v-model="model"
        type="checkbox"
        :class="CHECKBOX_INPUT"
        :disabled="disabled"
      />
      <Check
        aria-hidden="true"
        class="pointer-events-none absolute inset-0.5 hidden size-4 text-on-accent peer-checked:block"
      />
    </span>
    <span v-if="label" class="flex min-w-0 flex-col">
      <span class="text-sm font-semibold" :class="{ 'text-muted': disabled }">{{ label }}</span>
      <span v-if="description" class="text-meta text-muted">{{ description }}</span>
    </span>
  </label>
</template>
