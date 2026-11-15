<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemHeader.vue` with the facts strip and the tab row inside it: keep its boxes and text classes in sync. */
const TAB_COUNT = 3;
const STRIP_CELLS = 5;
</script>

<template>
  <div data-testid="problem-header">
    <p data-skeleton-region="meta" class="text-sm">
      <SkeletonBlock text class="w-40" />
    </p>
    <div data-skeleton-region="title" class="mt-1 page-title">
      <SkeletonBlock text class="w-3/4" />
    </div>
    <div
      data-skeleton-region="strip"
      class="mt-3 flex flex-wrap gap-px overflow-hidden rounded-row border border-line bg-line"
    >
      <div v-for="index in STRIP_CELLS" :key="index" class="grow basis-20 bg-surface px-3 py-1.5">
        <SkeletonBlock text class="w-14 text-meta" />
        <SkeletonBlock text class="w-10 text-sm" />
      </div>
    </div>
    <p class="mt-1 text-meta"><SkeletonBlock text class="my-3.5 w-48" /></p>
    <hr class="-mx-6 mt-4 border-line sm:-mx-8" />
    <div data-skeleton-region="tabs" class="mt-4 flex flex-wrap gap-2">
      <SkeletonBlock v-for="index in TAB_COUNT" :key="index" pill class="h-11 w-24" />
    </div>
  </div>
</template>
