<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `CasesTable.vue`: keep its card, header cells and row classes in sync. */
const ROW_COUNT = 6;
const COLUMN_COUNT = 5;
const NUMBER_COLUMN_COUNT = 3;
</script>

<template>
  <Card as="div" data-testid="cases-card" class="overflow-hidden rounded-card">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 px-4 pt-5 pb-3 sm:px-6">
      <h2 class="font-display text-title font-bold"><SkeletonBlock text class="w-40" /></h2>
    </div>
    <div class="overflow-x-auto">
      <table aria-hidden="true" class="w-full border-collapse sm:min-w-[560px] text-sm">
        <thead>
          <tr class="text-left text-meta text-muted">
            <th
              v-for="column in COLUMN_COUNT"
              :key="column"
              scope="col"
              class="px-6 py-3 font-medium"
            >
              <SkeletonBlock text class="w-12" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in ROW_COUNT"
            :key="row"
            data-skeleton-region="case-row"
            class="border-t border-line"
          >
            <th scope="row" class="px-6 py-3 text-left font-mono font-normal">
              <SkeletonBlock text class="w-6" />
            </th>
            <td class="px-6 py-3"><SkeletonBlock pill class="h-7 w-32" /></td>
            <td
              v-for="column in NUMBER_COLUMN_COUNT"
              :key="column"
              class="px-6 py-3 text-right font-mono"
            >
              <SkeletonBlock text class="ml-auto w-14" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>
</template>
