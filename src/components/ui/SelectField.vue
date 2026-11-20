<script setup lang="ts" generic="T extends string | number">
import { ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue';
import { CONTROL_FRAME, FIELD_FRAME, useFieldControl } from './FormField.control';
import { TOGGLE_ON } from './button-classes';

/**
 * The one native select (keyboard and screen readers for free), in two forms.
 *
 * A **form field** (the default): the field frame with a chevron. `placeholder` is the empty option; leave it out when the field
 * always has a value. Options go in the default slot, or in `options`; extra attributes go to the select. Inside a `FormField` it
 * takes the field's id and description.
 *
 * A **toolbar filter** (`prefix`): the same frame with a visible name before the chosen value ("Sắp xếp: Mới nhất"). It needs
 * `options`. The select covers the whole control, invisible, so a tap anywhere opens the list; the chosen text is drawn under it in
 * a box as wide as the longest option, so the control keeps its width. `active` marks a filter that narrows the list: it takes the
 * "on" look of a filter toggle. `#chosen-icon` is drawn before the chosen text (a language's icon) and its room is kept for every
 * option. Extra attributes go to the control's box.
 */
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  modelValue?: T;
  placeholder?: string;
  options?: { value: T; label: string }[];
  prefix?: string;
  active?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
defineSlots<{ default?: () => unknown; 'chosen-icon'?: () => unknown }>();
const field = useFieldControl();
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value !== undefined) emit('update:modelValue', value);
  },
});
const chosenLabel = computed(
  () => props.options?.find((option) => option.value === props.modelValue)?.label ?? '',
);
const toolbarFrame = computed(() =>
  props.active
    ? `${FIELD_FRAME} ${TOGGLE_ON} font-semibold`
    : `${FIELD_FRAME} hover:bg-surface-strong`,
);
</script>

<template>
  <label v-if="prefix !== undefined" v-bind="$attrs" class="relative" :class="toolbarFrame">
    <span class="text-muted">{{ prefix }}:</span>
    <span aria-hidden="true" class="grid max-w-44 pr-6 text-left">
      <span
        v-for="option in options"
        :key="option.value"
        class="invisible col-start-1 row-start-1 truncate"
        :class="{ 'pl-6': $slots['chosen-icon'] }"
        >{{ option.label }}</span
      >
      <span class="col-start-1 row-start-1 flex min-w-0 items-center gap-2">
        <slot name="chosen-icon" />
        <span class="truncate">{{ chosenLabel }}</span>
      </span>
    </span>
    <select
      :id="field?.id"
      v-model="model"
      :aria-describedby="field?.describedBy"
      class="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ChevronDown aria-hidden="true" class="pointer-events-none absolute right-3 size-4" />
  </label>
  <span v-else class="relative block">
    <select
      v-bind="$attrs"
      :id="field?.id"
      v-model="model"
      :aria-describedby="field?.describedBy"
      :aria-invalid="field?.invalid"
      :class="`${CONTROL_FRAME} h-(--qh-control) cursor-pointer appearance-none pr-8`"
    >
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
      <slot />
    </select>
    <ChevronDown
      aria-hidden="true"
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
    />
  </span>
</template>
