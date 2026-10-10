<script setup lang="ts">
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
import type { ProblemSort, ProblemSortField } from '@/api/types/problems';

/** A header's label; `interactive` false is the same text without the button (the skeleton). */
const props = defineProps<{
  field: ProblemSortField;
  label: string;
  sort: ProblemSort | null;
  interactive: boolean;
}>();
const emit = defineEmits<{ sort: [sort: ProblemSort] }>();

/** Numbers: highest first, then lowest first. The name: A to Z first. */
function nextSort(): ProblemSort {
  const { field } = props;
  const first: ProblemSort = field === 'name' ? field : `-${field}`;
  const second: ProblemSort = field === 'name' ? `-${field}` : field;
  return props.sort === first ? second : first;
}
</script>

<template>
  <button
    v-if="interactive"
    type="button"
    class="inline-flex min-h-11 items-center gap-1 hover:text-content"
    @click="emit('sort', nextSort())"
  >
    {{ label }}
    <ArrowDown v-if="sort === `-${field}`" class="size-3.5" aria-hidden="true" />
    <ArrowUp v-else-if="sort === field" class="size-3.5" aria-hidden="true" />
  </button>
  <span v-else class="inline-flex min-h-11 items-center">{{ label }}</span>
</template>
