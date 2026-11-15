<script setup lang="ts">
import { isProblemSort } from '@/api/types/problems';
import type { ProblemSort } from '@/api/types/problems';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { DEFAULT_SORT, sortOptions } from './problem-sort-options';

/** "Sắp xếp: Mới nhất ↓": every order the API offers. The default order is written to the URL as no sort. */
defineProps<{ sort: ProblemSort | null }>();
const emit = defineEmits<{ update: [sort: ProblemSort | null] }>();
const pick = (value: string) =>
  emit('update', value !== DEFAULT_SORT && isProblemSort(value) ? value : null);
</script>

<template>
  <ToolbarSelect
    :label="$t('problems.sort')"
    :model-value="sort ?? DEFAULT_SORT"
    :options="sortOptions()"
    :active="sort !== null"
    @update:model-value="pick"
  />
</template>
