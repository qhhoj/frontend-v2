<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemHeader.vue` and the tab row inside it: keep its boxes and text classes in sync. */
const TAB_COUNT = 3;
const STRIP_CHIPS = 4;
/** The layout's `strip` class: the strip shows below the rail's breakpoint (`lg`, or `xl` in a contest). */
defineProps<{ stripClass: string }>();
</script>

<template>
  <div data-testid="problem-header">
    <p data-skeleton-region="meta" class="text-sm">
      <SkeletonBlock text class="w-40" />
    </p>
    <div data-skeleton-region="title" class="mt-1 page-title">
      <SkeletonBlock text class="w-3/4" />
    </div>
    <!-- the limit strip (P-03), below the rail's breakpoint -->
    <div data-skeleton-region="strip" :class="['mt-3 flex flex-wrap gap-1.5', stripClass]">
      <SkeletonBlock v-for="index in STRIP_CHIPS" :key="index" pill class="h-7 w-20" />
    </div>
    <hr class="-mx-6 mt-4 border-line sm:-mx-8" />
    <div data-skeleton-region="tabs" class="mt-4 flex flex-wrap gap-2">
      <SkeletonBlock v-for="index in TAB_COUNT" :key="index" pill class="h-11 w-24" />
    </div>
  </div>
</template>
