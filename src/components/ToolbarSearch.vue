<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { toolbarControlClass } from './toolbar-classes';

/** The search box of a filter toolbar: a toolbar control with the magnifier at the left and a bare input in it. */
defineProps<{ label: string; placeholder: string; maxlength?: number }>();
const text = defineModel<string>({ required: true });
</script>

<template>
  <label :class="toolbarControlClass(false)">
    <span class="sr-only">{{ label }}</span>
    <Search class="size-4 shrink-0 text-muted" aria-hidden="true" />
    <input
      v-model="text"
      type="search"
      :maxlength="maxlength"
      :placeholder="placeholder"
      class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
    />
  </label>
</template>
