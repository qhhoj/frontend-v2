<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemHeader.vue` with the facts in the meta line and the tab row inside it: keep its boxes and text classes in sync. */
const TAB_COUNT = 3;
</script>

<template>
  <div data-testid="problem-header">
    <p data-skeleton-region="meta" class="text-sm">
      <SkeletonBlock text class="w-40" />
    </p>
    <div data-skeleton-region="title" class="mt-1 page-title">
      <SkeletonBlock text class="w-3/4" />
    </div>
    <p data-skeleton-region="strip" class="mt-1 text-meta"><SkeletonBlock text class="w-80" /></p>
    <div data-skeleton-region="tabs" class="mt-4 flex flex-wrap gap-2">
      <SkeletonBlock v-for="index in TAB_COUNT" :key="index" pill class="h-11 w-24" />
    </div>
  </div>
</template>
