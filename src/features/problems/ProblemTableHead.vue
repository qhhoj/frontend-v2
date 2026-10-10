<script setup lang="ts">
import type { ProblemSort, ProblemSortField } from '@/api/types/problems';
import ProblemSortButton from './ProblemSortButton.vue';

/** `interactive` false renders the same header with plain text (the skeleton), so nothing shifts when rows load. */
const props = defineProps<{ sort: ProblemSort | null; interactive: boolean }>();
const emit = defineEmits<{ sort: [sort: ProblemSort] }>();

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
    <tr class="bg-surface-strong text-left text-[13px] text-muted">
      <th scope="col" :class="`${CELL} pl-[22px]`">
        <span class="sr-only">{{ $t('problems.columns.status') }}</span>
      </th>
      <th scope="col" :class="`${CELL} px-3`" :aria-sort="ariaSort('name')">
        <ProblemSortButton
          field="name"
          :label="$t('problems.columns.problem')"
          :sort="sort"
          :interactive="interactive"
          @sort="emit('sort', $event)"
        />
      </th>
      <th scope="col" :class="`${CELL} px-3`">{{ $t('problems.columns.types') }}</th>
      <th
        v-for="column in NUMBER_COLUMNS"
        :key="column.field"
        scope="col"
        :aria-sort="ariaSort(column.field)"
        :class="`${CELL} ${column.cell}`"
      >
        <ProblemSortButton
          :field="column.field"
          :label="$t(column.labelKey)"
          :sort="sort"
          :interactive="interactive"
          @sort="emit('sort', $event)"
        />
      </th>
    </tr>
  </thead>
</template>
