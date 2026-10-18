<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { toolbarControlClass } from './toolbar-classes';

/**
 * The search box of a filter toolbar: a toolbar control with the magnifier at the left. The input covers the whole control,
 * border included, so it is as tall as the control (a touch target) and a tap anywhere on it types.
 */
defineProps<{ label: string; placeholder: string; maxlength?: number }>();
const text = defineModel<string>({ required: true });
</script>

<template>
  <label class="relative" :class="toolbarControlClass(false)">
    <span class="sr-only">{{ label }}</span>
    <Search class="size-4 shrink-0 text-muted" aria-hidden="true" />
    <input
      v-model="text"
      type="search"
      :maxlength="maxlength"
      :placeholder="placeholder"
      class="absolute -inset-px size-[calc(100%+2px)] rounded-row bg-transparent pr-3.5 pl-10 outline-none placeholder:text-muted"
    />
  </label>
</template>
