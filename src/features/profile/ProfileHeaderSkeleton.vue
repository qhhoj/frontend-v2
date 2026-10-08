<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Shaped like `ProfileHeader` and `ProfileTabsNav`, so the loaded page does not move. */
const TAB_COUNT = 5;
</script>

<template>
  <GlassCard
    data-testid="profile-header"
    class="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_16rem] md:p-8"
  >
    <div data-skeleton-region="header" class="flex min-w-0 flex-col gap-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SkeletonBlock class="size-24" round />
        <div class="flex flex-col gap-2">
          <SkeletonBlock class="h-[26px] w-24" pill />
          <SkeletonBlock class="h-9 w-56" />
          <SkeletonBlock class="h-6 w-64" />
          <div class="flex gap-2">
            <SkeletonBlock class="h-8 w-16" pill />
            <SkeletonBlock class="h-8 w-16" pill />
          </div>
        </div>
      </div>
      <div class="flex gap-2.5">
        <SkeletonBlock class="h-11 w-32" pill />
        <SkeletonBlock class="h-11 w-28" pill />
      </div>
    </div>
    <div data-skeleton-region="rating" class="flex flex-col">
      <SkeletonBlock class="min-h-28 w-full" />
    </div>
  </GlassCard>
  <div data-skeleton-region="tabs" class="flex gap-2 overflow-hidden">
    <SkeletonBlock v-for="index in TAB_COUNT" :key="index" class="min-h-11 w-28 shrink-0" pill />
  </div>
</template>
