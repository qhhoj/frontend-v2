<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { CONTROL_FRAME, useFieldControl } from './FormField.control';

/**
 * A native select with a chevron. `placeholder` is the empty option; leave it out when the field always has a value. Options
 * go in the default slot; extra attributes go to the select. Inside a `FormField` it takes the field's id and description.
 */
defineOptions({ inheritAttrs: false });
defineProps<{ placeholder?: string }>();
const model = defineModel<string | number>();
const field = useFieldControl();
</script>

<template>
  <span class="relative block">
    <select
      v-bind="$attrs"
      :id="field?.id"
      v-model="model"
      :aria-describedby="field?.describedBy"
      :aria-invalid="field?.invalid"
      :class="`${CONTROL_FRAME} h-(--qh-control) appearance-none pr-10`"
    >
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <slot />
    </select>
    <ChevronDown
      aria-hidden="true"
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
    />
  </span>
</template>
