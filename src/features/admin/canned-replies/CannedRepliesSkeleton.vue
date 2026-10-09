<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

const ROWS = 5;
</script>

<template>
  <div class="overflow-x-auto" data-skeleton-region="canned-table">
    <table class="w-full text-left text-sm">
      <thead class="text-muted">
        <tr>
          <th scope="col" class="px-2 py-2 font-semibold"><SkeletonBlock text class="w-10" /></th>
          <th scope="col" class="px-2 py-2 font-semibold"><SkeletonBlock text class="w-16" /></th>
          <th scope="col" class="hidden px-2 py-2 font-semibold sm:table-cell">
            <SkeletonBlock text class="w-16" />
          </th>
          <th scope="col" class="px-2 py-2 font-semibold"><SkeletonBlock text class="w-16" /></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in ROWS"
          :key="row"
          data-skeleton-region="canned-row"
          class="border-t border-line align-top"
        >
          <td class="px-2 py-2 tabular-nums"><SkeletonBlock text class="w-6" /></td>
          <td class="px-2 py-2 font-semibold"><SkeletonBlock text class="w-24 sm:w-40" /></td>
          <td class="hidden px-2 py-2 sm:table-cell"><SkeletonBlock text class="w-full" /></td>
          <td class="px-2 py-2">
            <div class="flex gap-2">
              <SkeletonBlock pill class="h-11 w-16" />
              <SkeletonBlock pill class="h-11 w-16" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
