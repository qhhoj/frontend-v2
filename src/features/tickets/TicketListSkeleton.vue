<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `TicketListPane.vue`: two lines per row, the title with its chip, then the meta line. */
const ROW_COUNT = 8;
</script>

<template>
  <ul aria-hidden="true" class="flex flex-col">
    <li
      v-for="row in ROW_COUNT"
      :key="row"
      class="border-t border-line px-4 py-2.5 first:border-t-0"
    >
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1 text-meta leading-5"><SkeletonBlock text class="w-3/4" /></div>
        <SkeletonBlock pill class="h-5.5 w-16" />
      </div>
      <div class="mt-1 flex items-center gap-2 text-caption">
        <SkeletonBlock text class="w-12" />
        <SkeletonBlock pill class="h-5.5 w-16" />
        <SkeletonBlock text class="w-20" />
      </div>
    </li>
  </ul>
</template>
