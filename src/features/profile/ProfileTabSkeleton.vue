<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  BODY_CELL_CLASSES,
  HEADER_CELL_CLASSES,
} from '@/features/submissions/submission-table-cells';

/** Placeholder rows that take the height of a profile tab's loaded rows: `groups` (solved), `table` (PP) or `list` (posts, comments). */
defineProps<{ rows: number; kind: 'groups' | 'table' | 'list' }>();
/** The PP table's columns: the phone hides the same three as the loaded table. */
const TABLE_COLUMNS = [
  { key: 'rank', header: 'w-10', cell: 'w-8', visibility: '' },
  { key: 'problem', header: 'w-12', cell: 'w-40', visibility: '' },
  { key: 'weight', header: 'w-14', cell: 'w-14', visibility: 'hidden md:table-cell' },
  { key: 'points', header: 'w-14', cell: 'w-14', visibility: 'hidden md:table-cell' },
  { key: 'scaled', header: 'w-14', cell: 'w-14', visibility: '' },
  { key: 'submission', header: 'w-16', cell: 'w-28', visibility: 'hidden md:table-cell' },
] as const;
</script>

<template>
  <GlassCard v-if="kind === 'table'" as="div" class="overflow-hidden">
    <div class="overflow-x-auto">
      <table aria-hidden="true" class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-meta text-muted">
            <th
              v-for="column in TABLE_COLUMNS"
              :key="column.key"
              scope="col"
              :class="[HEADER_CELL_CLASSES, column.visibility]"
            >
              <SkeletonBlock text :class="column.header" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row"
            data-skeleton-region="row"
            class="border-t border-line"
          >
            <td
              v-for="column in TABLE_COLUMNS"
              :key="column.key"
              :class="[BODY_CELL_CLASSES, column.visibility]"
            >
              <template v-if="column.key === 'problem'">
                <!-- The real cell has the name and, under it, the code in a smaller font. -->
                <SkeletonBlock text :class="column.cell" />
                <div class="font-mono text-xs"><SkeletonBlock text class="w-16" /></div>
              </template>
              <span v-else-if="column.key === 'submission'" class="flex flex-col items-start gap-1">
                <SkeletonBlock pill class="h-7 w-20" />
                <span class="font-mono text-xs"><SkeletonBlock text class="w-14" /></span>
                <span class="text-xs"><SkeletonBlock text class="w-28" /></span>
              </span>
              <SkeletonBlock v-else text :class="column.cell" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </GlassCard>
  <ul v-else aria-hidden="true" class="flex flex-col gap-3">
    <li v-for="row in rows" :key="row">
      <GlassCard as="div" class="flex flex-col gap-2 p-4">
        <SkeletonBlock v-if="kind === 'groups'" text class="w-1/3" />
        <SkeletonBlock text class="w-2/3" />
        <SkeletonBlock text class="w-1/2" />
      </GlassCard>
    </li>
  </ul>
</template>
