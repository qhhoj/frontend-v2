<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemTable.vue`: keep its table, header and cell classes in sync. */
const ROW_COUNT = 8;
const NUMBER_COLUMNS = 3;
</script>

<template>
  <div class="overflow-x-auto">
    <table aria-hidden="true" class="w-full min-w-[900px] border-collapse text-[15px]">
      <thead>
        <tr class="text-left text-[13px] text-muted">
          <th scope="col" class="px-6 py-4 font-medium"><SkeletonBlock text class="w-20" /></th>
          <th scope="col" class="px-2.5 py-4 font-medium"><SkeletonBlock text class="w-16" /></th>
          <th
            v-for="column in NUMBER_COLUMNS"
            :key="column"
            scope="col"
            class="px-2.5 py-2 text-right font-medium"
          >
            <span class="inline-flex min-h-11 items-center"
              ><SkeletonBlock text class="w-12"
            /></span>
          </th>
          <th scope="col" class="px-6 py-4 text-right font-medium" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in ROW_COUNT" :key="row" class="border-t border-line">
          <td class="px-6 py-3.5">
            <div class="flex items-center gap-3">
              <SkeletonBlock round class="size-10 shrink-0" />
              <div class="min-w-0">
                <div class="font-semibold"><SkeletonBlock text class="w-56" /></div>
                <div class="font-mono text-xs"><SkeletonBlock text class="w-16" /></div>
              </div>
            </div>
          </td>
          <td class="px-2.5 py-3.5"><SkeletonBlock text class="w-20" /></td>
          <td
            v-for="column in NUMBER_COLUMNS"
            :key="column"
            class="px-2.5 py-3.5 text-right font-mono"
          >
            <SkeletonBlock text class="w-10" />
          </td>
          <td class="px-6 py-3.5 text-right"><SkeletonBlock class="ml-auto h-11 w-20" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
