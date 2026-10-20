<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue';
import { toolbarControlClass } from './toolbar-classes';

/**
 * A native select (keyboard and screen readers for free) dressed as a toolbar button with a visible prefix. The select
 * itself covers the whole control, border included, invisible, so a tap anywhere on it opens the list and it is as tall as the
 * control (a touch target); the chosen text is drawn under it, in a box as wide as the longest option so the control keeps its width.
 */
const props = defineProps<{
  label: string;
  modelValue: string;
  options: { value: string; label: string }[];
  active: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const chosen = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? '',
);
</script>

<template>
  <label class="relative" :class="toolbarControlClass(active)">
    <span class="text-muted">{{ label }}:</span>
    <!-- Drawn before the chosen text, e.g. the chosen language's icon. -->
    <slot name="chosen-icon" />
    <span aria-hidden="true" class="grid max-w-44 pr-5 text-left">
      <span
        v-for="option in options"
        :key="option.value"
        class="invisible col-start-1 row-start-1 truncate"
        >{{ option.label }}</span
      >
      <span class="col-start-1 row-start-1 truncate">{{ chosen }}</span>
    </span>
    <select
      :value="modelValue"
      class="absolute -inset-px size-[calc(100%+2px)] cursor-pointer appearance-none opacity-0"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ChevronDown class="pointer-events-none absolute right-3 size-4" aria-hidden="true" />
  </label>
</template>
