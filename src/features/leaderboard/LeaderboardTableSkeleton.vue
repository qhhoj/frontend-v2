<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import type { BoardSort } from '@/api/types/users';
import {
  BOARD_HEAD_CLASS,
  BOARD_TABLE_CLASS,
  SKELETON_ROW_COUNT,
  BOARD_ROW_CLASS,
  SPACER_CELL_CLASS,
  SPACER_HEAD_CLASS,
  ORGANIZATION_HEAD_CLASS,
  RANK_HEAD_CLASS,
  USER_HEAD_CLASS,
  valueHeadClass,
  ORGANIZATION_CELL_CLASS,
  RANK_CELL_CLASS,
  USER_CELL_CLASS,
  valueCellClass,
} from './leaderboard-cells';
import { boardColumns } from './leaderboard-columns';

const props = defineProps<{ sort: BoardSort }>();
const columns = computed(() => boardColumns(props.sort));
const rows = Array.from({ length: SKELETON_ROW_COUNT }, (_row, index) => index);
</script>

<template>
  <div class="overflow-x-auto">
    <table :class="BOARD_TABLE_CLASS" data-skeleton-region="board">
      <thead :class="BOARD_HEAD_CLASS">
        <tr>
          <th scope="col" :class="RANK_HEAD_CLASS"><SkeletonBlock text class="w-8" /></th>
          <th scope="col" :class="USER_HEAD_CLASS"><SkeletonBlock text class="w-24" /></th>
          <th scope="col" :class="ORGANIZATION_HEAD_CLASS">
            <SkeletonBlock text class="w-20" />
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="valueHeadClass(column.isActive)"
          >
            <SkeletonBlock text class="w-16" />
          </th>
          <th v-if="sort === 'contributors'" scope="col" :class="SPACER_HEAD_CLASS" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row" :class="BOARD_ROW_CLASS">
          <td :class="RANK_CELL_CLASS"><SkeletonBlock text class="w-6" /></td>
          <td :class="USER_CELL_CLASS">
            <span class="flex items-center gap-2.5">
              <SkeletonBlock round class="size-7" />
              <span class="flex min-w-0 flex-col">
                <span class="text-sm"><SkeletonBlock text class="w-24" /></span>
                <span class="text-xs"><SkeletonBlock text class="w-16" /></span>
              </span>
            </span>
          </td>
          <td :class="ORGANIZATION_CELL_CLASS">
            <SkeletonBlock text class="w-16" />
          </td>
          <td v-for="column in columns" :key="column.key" :class="valueCellClass(column.isActive)">
            <SkeletonBlock text class="w-12" />
          </td>
          <td v-if="sort === 'contributors'" :class="SPACER_CELL_CLASS" />
        </tr>
      </tbody>
    </table>
  </div>
</template>
