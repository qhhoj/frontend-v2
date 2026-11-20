<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemHeader.vue` (eyebrow, title, tab row): keep its boxes and text classes in sync. */
const TAB_COUNT = 3;
</script>

<template>
  <div data-testid="problem-header">
    <p data-skeleton-region="meta" class="text-small">
      <SkeletonBlock text class="w-40" />
    </p>
    <div data-skeleton-region="title" class="page-title">
      <SkeletonBlock text class="w-3/4" />
    </div>
    <div data-skeleton-region="tabs" class="mt-4 flex flex-wrap gap-2">
      <SkeletonBlock v-for="index in TAB_COUNT" :key="index" pill class="h-(--qh-control) w-24" />
    </div>
  </div>
</template>
