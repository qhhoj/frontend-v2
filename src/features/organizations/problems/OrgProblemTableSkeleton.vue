<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';

/** Four rows shaped like `OrgProblemTable`, or like `OrgProblemCardList` on a phone (the e2e shift case answers four rows). */
defineProps<{ isAdmin: boolean }>();
const ROWS = 4;
const CELL = 'py-2 pr-3 align-middle';
const isCards = useMediaQuery(COMPACT_LIST_QUERY);
</script>

<template>
  <ul
    v-if="isCards"
    data-skeleton-region="org-problem-table"
    class="m-0 flex list-none flex-col p-0"
  >
    <li v-for="index in ROWS" :key="index" class="flex items-start gap-1 border-t border-line py-3">
      <SkeletonBlock v-if="isAdmin" class="size-11 shrink-0" />
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <p class="m-0 text-sm"><SkeletonBlock text class="w-48" /></p>
        <p class="m-0 text-meta"><SkeletonBlock text class="w-16" /></p>
        <div v-if="isAdmin" class="flex gap-2">
          <SkeletonBlock pill class="h-11 w-16" />
          <SkeletonBlock pill class="h-11 w-24" />
        </div>
      </div>
    </li>
  </ul>
  <div v-else class="@container">
    <table data-skeleton-region="org-problem-table" class="w-full text-left text-sm">
      <thead class="text-muted">
        <tr>
          <th v-if="isAdmin" class="w-11 py-2 pr-3"><SkeletonBlock class="size-11" /></th>
          <th v-for="index in 3" :key="index" :class="CELL"><SkeletonBlock text class="w-12" /></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="index in ROWS" :key="index" class="border-t border-line">
          <td v-if="isAdmin" class="py-2 pr-3"><SkeletonBlock class="size-11" /></td>
          <td :class="CELL"><SkeletonBlock text class="w-16" /></td>
          <td :class="CELL"><SkeletonBlock text class="w-40" /></td>
          <td class="hidden @3xl:table-cell" :class="CELL">
            <SkeletonBlock pill class="h-6 w-24" />
          </td>
          <td class="hidden @3xl:table-cell" :class="CELL">
            <SkeletonBlock text class="ml-auto w-10" />
          </td>
          <td v-if="isAdmin" class="py-2">
            <div class="flex justify-end gap-2">
              <SkeletonBlock pill class="h-11 w-16" />
              <SkeletonBlock pill class="h-11 w-24" />
            </div>
          </td>
          <td v-else class="h-11 py-2" />
        </tr>
      </tbody>
    </table>
  </div>
</template>
