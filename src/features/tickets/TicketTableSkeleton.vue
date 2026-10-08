<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `TicketTable.vue`: keep its header and cell classes in sync. */
const ROW_COUNT = 8;
const HEADER_COLUMNS = 5;
</script>

<template>
  <div class="overflow-x-auto">
    <table aria-hidden="true" class="w-full border-collapse text-[15px]">
      <thead>
        <tr class="text-left text-[13px] text-muted">
          <th
            v-for="column in HEADER_COLUMNS"
            :key="column"
            scope="col"
            class="px-4 py-4 font-medium md:px-6"
          >
            <SkeletonBlock text class="w-20" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in ROW_COUNT" :key="row" class="border-t border-line">
          <td class="px-4 py-3.5 md:px-6">
            <SkeletonBlock text class="w-56" />
            <SkeletonBlock text class="mt-2 w-24" />
          </td>
          <td class="hidden px-2.5 py-3.5 md:table-cell"><SkeletonBlock text class="w-20" /></td>
          <td class="hidden px-2.5 py-3.5 md:table-cell"><SkeletonBlock text class="w-16" /></td>
          <td class="hidden px-2.5 py-3.5 md:table-cell"><SkeletonBlock text class="w-10" /></td>
          <td class="px-4 py-3.5 md:px-6"><SkeletonBlock text class="w-16" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
