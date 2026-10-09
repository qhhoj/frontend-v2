<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Four rows shaped like `OrgProblemTable` (the e2e shift case answers four rows). */
defineProps<{ isAdmin: boolean }>();
const ROWS = 4;
const CELL = 'py-2 pr-3 align-middle';
</script>

<template>
  <table data-skeleton-region="org-problem-table" class="w-full text-left text-sm">
    <thead class="text-muted">
      <tr>
        <th v-for="index in 3" :key="index" :class="CELL"><SkeletonBlock text class="w-12" /></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="index in ROWS" :key="index" class="border-t border-line">
        <td v-if="isAdmin" class="py-2 pr-3"><SkeletonBlock class="size-11" /></td>
        <td :class="CELL"><SkeletonBlock text class="w-16" /></td>
        <td :class="CELL"><SkeletonBlock text class="w-40" /></td>
        <td class="hidden md:table-cell" :class="CELL"><SkeletonBlock pill class="h-6 w-24" /></td>
        <td class="hidden md:table-cell" :class="CELL">
          <SkeletonBlock text class="ml-auto w-10" />
        </td>
        <td v-if="isAdmin" class="py-2">
          <div class="flex flex-col items-end gap-2 md:flex-row md:justify-end">
            <SkeletonBlock pill class="h-11 w-16" />
            <SkeletonBlock pill class="h-11 w-24" />
          </div>
        </td>
        <td v-else class="h-11 py-2" />
      </tr>
    </tbody>
  </table>
</template>
