<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { LEADERBOARD_PAGE_SIZE } from '@/api/types/users';
import type { BoardSort } from '@/api/types/users';
import {
  BOARD_ROW_CLASS,
  ORGANIZATION_CELL_CLASS,
  RANK_CELL_CLASS,
  USER_CELL_CLASS,
  valueCellClass,
} from './leaderboard-cells';
import { boardColumns } from './leaderboard-columns';

const props = defineProps<{ sort: BoardSort }>();
const columns = computed(() => boardColumns(props.sort));
/** One skeleton row per row of a full page, so the loaded page is as tall. */
const rows = Array.from({ length: LEADERBOARD_PAGE_SIZE }, (_row, index) => index);
</script>

<template>
  <table class="w-full text-sm" data-skeleton-region="board">
    <thead class="text-left text-[12px] font-semibold tracking-wide text-muted uppercase">
      <tr>
        <th scope="col" class="px-3 py-2 text-right"><SkeletonBlock text class="w-8" /></th>
        <th scope="col" class="px-3 py-2"><SkeletonBlock text class="w-24" /></th>
        <th v-if="sort !== 'contributors'" scope="col" class="hidden px-3 py-2 md:table-cell">
          <SkeletonBlock text class="w-20" />
        </th>
        <th
          v-for="column in columns"
          :key="column.key"
          scope="col"
          class="px-3 py-2 text-right"
          :class="column.isActive ? '' : 'hidden md:table-cell'"
        >
          <SkeletonBlock text class="w-16" />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row" :class="BOARD_ROW_CLASS">
        <td :class="RANK_CELL_CLASS"><SkeletonBlock text class="w-6" /></td>
        <td :class="USER_CELL_CLASS">
          <span class="flex items-center gap-2.5">
            <SkeletonBlock round class="size-7" />
            <SkeletonBlock text class="w-24" />
          </span>
        </td>
        <td v-if="sort !== 'contributors'" :class="ORGANIZATION_CELL_CLASS">
          <SkeletonBlock text class="w-16" />
        </td>
        <td v-for="column in columns" :key="column.key" :class="valueCellClass(column.isActive)">
          <SkeletonBlock text class="w-12" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
