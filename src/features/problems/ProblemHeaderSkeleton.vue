<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemHeader.vue` and the tab row inside it: keep its boxes and text classes in sync. */
const TAB_COUNT = 3;
</script>

<template>
  <GlassCard data-testid="problem-header" class="rounded-panel px-6 pt-6 sm:px-8 sm:pt-8">
    <p data-skeleton-region="meta" class="font-mono text-sm">
      <SkeletonBlock text class="w-40" />
    </p>
    <div data-skeleton-region="title" class="mt-1 page-title">
      <SkeletonBlock text class="w-3/4" />
      <!-- a phone title reserves two lines -->
      <span class="sm:hidden"><br /><SkeletonBlock text class="w-1/2" /></span>
    </div>
    <div data-skeleton-region="tabs" class="mt-4 flex flex-wrap gap-2 pb-4">
      <SkeletonBlock v-for="index in TAB_COUNT" :key="index" pill class="h-11 w-24" />
    </div>
  </GlassCard>
</template>
