<script setup lang="ts">
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import ProblemTableColumns from './ProblemTableColumns.vue';
import ProblemTableHead from './ProblemTableHead.vue';

/** Mirrors `ProblemTable.vue`: same colgroup, the real header, same cell classes. Keep them in sync. */
const ROW_COUNT = 8;
</script>

<template>
  <ScrollRegion placeholder label="">
    <table aria-hidden="true" class="w-full min-w-[900px] table-fixed border-collapse text-sm">
      <ProblemTableColumns />
      <ProblemTableHead :sort="null" :interactive="false" />
      <tbody>
        <tr v-for="row in ROW_COUNT" :key="row" class="border-t border-line">
          <td class="py-2.5 pl-[22px]"><SkeletonBlock round class="size-[18px]" /></td>
          <td class="min-w-0 px-3 py-2">
            <div class="font-medium"><SkeletonBlock text class="w-56" /></div>
            <span class="font-mono text-xs"><SkeletonBlock text class="w-16" /></span>
          </td>
          <td class="px-3 py-2 text-caption"><SkeletonBlock text class="w-32" /></td>
          <td class="px-3 py-2"><SkeletonBlock text class="w-14" /></td>
          <td class="px-3 py-2 text-right"><SkeletonBlock text class="ml-auto w-10" /></td>
          <td class="py-2 pr-[22px] pl-3 text-right"><SkeletonBlock text class="ml-auto w-8" /></td>
        </tr>
      </tbody>
    </table>
  </ScrollRegion>
</template>
