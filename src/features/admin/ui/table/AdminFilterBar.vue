<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import FilterBar from '@/components/ui/FilterBar.vue';
import type { ActiveFilter } from '@/components/ui/FilterBar.vue';

export type { ActiveFilter };

/** The admin list filter row: the shared `FilterBar` (search, inline selects, view switch, filter panel, chips). */
withDefaults(
  defineProps<{
    searchLabel: string;
    resultText?: string;
    exact?: { label: string; to: RouteLocationRaw } | null;
    chips?: ActiveFilter[];
    filterCount?: number;
  }>(),
  { resultText: undefined, exact: null, chips: () => [], filterCount: 0 },
);
const search = defineModel<string>('search', { default: '' });
defineEmits<{ remove: [key: string]; 'clear-all': [] }>();
</script>

<template>
  <FilterBar
    v-model:search="search"
    :search-label="searchLabel"
    :result-text="resultText"
    :exact="exact"
    :chips="chips"
    :filter-count="filterCount"
    @remove="$emit('remove', $event)"
    @clear-all="$emit('clear-all')"
  >
    <template v-if="$slots.selects" #selects><slot name="selects" /></template>
    <template v-if="$slots.view" #view><slot name="view" /></template>
    <template v-if="$slots.filters" #filters><slot name="filters" /></template>
  </FilterBar>
</template>
