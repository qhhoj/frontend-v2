<script setup lang="ts">
import { ArrowDownUp } from 'lucide-vue-next';
import { isProblemSort } from '@/api/types/problems';
import type { ProblemSort } from '@/api/types/problems';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { buttonClasses } from '@/components/ui/button-classes';
import { DEFAULT_SORT, sortOptions } from './problem-sort-options';

/**
 * "Sắp xếp: Mới nhất ↓": every order the API offers. The default order is written to the URL as no sort. `iconOnly` (a phone's
 * toolbar) draws a square icon button; the native select covers it, invisible, so a tap anywhere on it opens the list.
 */
const props = defineProps<{ sort: ProblemSort | null; iconOnly?: boolean }>();
const emit = defineEmits<{ update: [sort: ProblemSort | null] }>();
const pick = (value: string) =>
  emit('update', value !== DEFAULT_SORT && isProblemSort(value) ? value : null);
</script>

<template>
  <label
    v-if="iconOnly"
    class="relative"
    :class="[
      buttonClasses({ iconOnly: true }),
      props.sort !== null && 'border-accent bg-accent-soft text-accent-soft-text',
    ]"
    :title="$t('problems.sort')"
  >
    <ArrowDownUp class="size-4" aria-hidden="true" />
    <select
      :aria-label="$t('problems.sort')"
      :value="props.sort ?? DEFAULT_SORT"
      class="absolute -inset-px size-[calc(100%+2px)] cursor-pointer appearance-none text-base opacity-0"
      @change="pick(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in sortOptions()" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
  <ToolbarSelect
    v-else
    :label="$t('problems.sort')"
    :model-value="props.sort ?? DEFAULT_SORT"
    :options="sortOptions()"
    :active="props.sort !== null"
    @update:model-value="pick"
  />
</template>
