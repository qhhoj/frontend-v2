<script setup lang="ts">
import type { ProblemSort, ProblemSortField } from '@/api/types/problems';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import ProblemSortButton from './ProblemSortButton.vue';

/** `interactive` false renders the same cells with placeholder blocks (the skeleton: no text to read), so nothing shifts when rows load. */
const props = defineProps<{ sort: ProblemSort | null; interactive: boolean }>();
const emit = defineEmits<{ sort: [sort: ProblemSort | null] }>();

const ariaSort = (field: ProblemSortField) =>
  props.sort === field ? 'ascending' : props.sort === `-${field}` ? 'descending' : 'none';
const CELL = 'py-2 font-medium';
const NUMBER_COLUMNS = [
  { field: 'points', labelKey: 'problems.columns.points', cell: 'px-3' },
  { field: 'acRate', labelKey: 'problems.columns.acRate', cell: 'px-3 text-right' },
  { field: 'userCount', labelKey: 'problems.columns.users', cell: 'pr-[22px] pl-3 text-right' },
] as const;
</script>

<template>
  <thead>
    <tr class="bg-surface-strong text-left text-meta text-muted">
      <th scope="col" :class="`${CELL} pl-[22px]`">
        <span v-if="interactive" class="sr-only">{{ $t('problems.columns.status') }}</span>
      </th>
      <th scope="col" :class="`${CELL} px-3`" :aria-sort="ariaSort('name')">
        <ProblemSortButton
          v-if="interactive"
          field="name"
          :label="$t('problems.columns.problem')"
          :sort="sort"
          :interactive="interactive"
          @sort="emit('sort', $event)"
        />
        <span v-else class="inline-flex min-h-11 items-center"
          ><SkeletonBlock text class="w-10"
        /></span>
      </th>
      <th scope="col" :class="`${CELL} px-3`">
        <template v-if="interactive">{{ $t('problems.columns.types') }}</template>
        <span v-else class="inline-flex min-h-11 items-center"
          ><SkeletonBlock text class="w-16"
        /></span>
      </th>
      <th
        v-for="column in NUMBER_COLUMNS"
        :key="column.field"
        scope="col"
        :aria-sort="ariaSort(column.field)"
        :class="`${CELL} ${column.cell}`"
      >
        <ProblemSortButton
          v-if="interactive"
          :field="column.field"
          :label="$t(column.labelKey)"
          :sort="sort"
          :interactive="interactive"
          @sort="emit('sort', $event)"
        />
        <span
          v-else
          class="flex min-h-11 items-center"
          :class="{ 'justify-end': column.field !== 'points' }"
          ><SkeletonBlock text class="w-10"
        /></span>
      </th>
    </tr>
  </thead>
</template>
