<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { toolbarControlClass } from './toolbar-classes';

/** A native select (keyboard and screen readers for free) dressed as a toolbar button with a visible prefix. */
defineProps<{
  label: string;
  modelValue: string;
  options: { value: string; label: string }[];
  active: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <label class="relative" :class="toolbarControlClass(active)">
    <span class="text-muted">{{ label }}:</span>
    <select
      :value="modelValue"
      class="max-w-44 cursor-pointer appearance-none truncate bg-transparent pr-5 text-current outline-none"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ChevronDown class="pointer-events-none absolute right-3 size-4" aria-hidden="true" />
  </label>
</template>
