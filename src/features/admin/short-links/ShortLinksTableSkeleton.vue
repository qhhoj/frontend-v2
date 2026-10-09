<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ShortLinksTable.vue`: the same card and one block per 44 px row (the delete button sets the row height). */
const ROW_COUNT = 6;
</script>

<template>
  <div class="glass flex flex-col rounded-card">
    <div class="h-9" />
    <div
      v-for="row in ROW_COUNT"
      :key="row"
      data-skeleton-region="short-link-row"
      class="flex h-[61px] items-center gap-6 border-t border-line px-3"
    >
      <SkeletonBlock class="h-4 w-24" />
      <SkeletonBlock class="h-4 flex-1" />
      <SkeletonBlock round class="size-11" />
    </div>
  </div>
</template>
