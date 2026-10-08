<script setup lang="ts">
import { computed } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionTable.vue`: keep its card, table, header and cell classes in sync. */
const ROW_COUNT = 10;
const props = withDefaults(defineProps<{ showProblem?: boolean }>(), { showProblem: true });
/** Header cell width, then the cell's own width, per column in the table's order. */
const COLUMNS = [
  { key: 'verdict', header: 'w-14', cell: 'w-16', isNumber: false },
  { key: 'problem', header: 'w-12', cell: 'w-40', isNumber: false },
  { key: 'user', header: 'w-16', cell: 'w-24', isNumber: false },
  { key: 'score', header: 'w-10', cell: 'w-10', isNumber: true },
  { key: 'time', header: 'w-14', cell: 'w-14', isNumber: true },
  { key: 'memory', header: 'w-14', cell: 'w-14', isNumber: true },
  { key: 'language', header: 'w-16', cell: 'w-16', isNumber: false },
  { key: 'when', header: 'w-14', cell: 'w-20', isNumber: false },
] as const;
const columns = computed(() =>
  COLUMNS.filter((column) => props.showProblem || column.key !== 'problem'),
);
</script>

<template>
  <GlassCard as="div" data-testid="submission-table-card" class="overflow-hidden">
    <div class="overflow-x-auto">
      <table aria-hidden="true" class="w-full min-w-[900px] border-collapse text-[15px]">
        <thead>
          <tr class="text-left text-[13px] text-muted">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-3 py-3.5 font-medium first:pl-6 last:pr-6"
              :class="{ 'text-right': column.isNumber }"
            >
              <SkeletonBlock text :class="column.header" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in ROW_COUNT"
            :key="row"
            data-skeleton-region="row"
            class="border-t border-line"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-3 py-[11px] first:pl-6 last:pr-6"
              :class="{ 'text-right font-mono': column.isNumber }"
            >
              <SkeletonBlock
                v-if="column.key === 'verdict'"
                pill
                class="h-7"
                :class="column.cell"
              />
              <SkeletonBlock v-else text :class="column.cell" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </GlassCard>
</template>
