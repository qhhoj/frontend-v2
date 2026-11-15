<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/**
 * Shaped like the loaded `ProfileHeader`: the avatar at the start (96 px, 32 px on a phone), the name, the meta line, and
 * the rating figure at the right from `md`, all on the page background. Actions are data-dependent and are not drawn.
 */
const TAB_COUNT = 5;
</script>

<template>
  <div data-testid="profile-header" class="flex items-center gap-3 sm:gap-5">
    <SkeletonBlock class="size-8 shrink-0 sm:size-24" round />
    <div data-skeleton-region="header" class="flex min-w-0 flex-1 flex-col gap-2">
      <SkeletonBlock class="h-7 w-48" />
      <SkeletonBlock class="h-4 w-64 max-w-full" />
    </div>
    <div data-skeleton-region="rating" class="flex flex-col items-end gap-1 max-md:hidden">
      <SkeletonBlock class="h-9 w-20" />
      <SkeletonBlock class="h-4 w-40" />
    </div>
  </div>
  <div data-skeleton-region="tabs" class="flex gap-2 overflow-hidden">
    <SkeletonBlock v-for="index in TAB_COUNT" :key="index" class="min-h-11 w-28 shrink-0" pill />
  </div>
</template>
