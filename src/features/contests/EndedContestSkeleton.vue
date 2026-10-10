<script setup lang="ts">
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  ENDED_CELL,
  ENDED_HEAD_ROW_CLASS,
  ENDED_ROW_CLASS,
  ENDED_TABLE_CLASS,
} from './ended-columns';

/** Mirrors `EndedContestTable.vue`: same table and column classes (`ended-columns.ts`), so the loaded table has the same columns. */
const ROW_COUNT = 5;
</script>

<template>
  <div class="glass overflow-hidden rounded-card">
    <ScrollRegion placeholder label="">
      <table aria-hidden="true" :class="ENDED_TABLE_CLASS">
        <thead>
          <tr :class="ENDED_HEAD_ROW_CLASS">
            <th scope="col" :class="ENDED_CELL.name" data-skeleton-region="ended-header">
              <SkeletonBlock text class="w-24" />
            </th>
            <th scope="col" :class="ENDED_CELL.when"><SkeletonBlock text class="w-20" /></th>
            <th scope="col" :class="ENDED_CELL.format"><SkeletonBlock text class="w-20" /></th>
            <th scope="col" :class="ENDED_CELL.participants">
              <SkeletonBlock text class="ml-auto w-16" />
            </th>
            <th scope="col" :class="ENDED_CELL.action" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in ROW_COUNT"
            :key="row"
            data-skeleton-region="ended-row"
            :class="ENDED_ROW_CLASS"
          >
            <td :class="ENDED_CELL.name">
              <SkeletonBlock text class="w-48" />
              <span class="block font-mono text-[12.5px]"><SkeletonBlock text class="w-16" /></span>
            </td>
            <td :class="ENDED_CELL.when"><SkeletonBlock text class="w-28" /></td>
            <td :class="ENDED_CELL.format"><SkeletonBlock pill class="h-6 w-24" /></td>
            <td :class="ENDED_CELL.participants">
              <SkeletonBlock text class="ml-auto w-10" />
            </td>
            <td :class="ENDED_CELL.action"><SkeletonBlock pill class="ml-auto h-11 w-24" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </div>
</template>
