<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `IntegrationClientsTable.vue`: the same card and 61 px rows (the 44 px revoke button and the cell padding). */
const ROW_COUNT = 3;
</script>

<template>
  <div class="glass flex flex-col rounded-card">
    <div class="h-9" />
    <div
      v-for="row in ROW_COUNT"
      :key="row"
      data-skeleton-region="integration-row"
      class="flex h-[61px] items-center gap-6 border-t border-line px-3"
    >
      <SkeletonBlock class="h-4 w-32" />
      <SkeletonBlock class="h-4 flex-1" />
      <SkeletonBlock pill class="h-11 w-24" />
    </div>
  </div>
</template>
