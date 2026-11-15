<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { RATING_BOX_CLASSES } from './profile-geometry';

/**
 * Shaped like the common loaded profile: the avatar, the tier chip and the joined line, then the rating box
 * at its fixed height. Own or staff actions are data-dependent and are not drawn.
 * The page title above the card is `ProfileLayout`'s `PageHeader`, drawn here as one block.
 */
const TAB_COUNT = 5;
</script>

<template>
  <SkeletonBlock class="h-8 w-48" />
  <Card
    data-testid="profile-header"
    class="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_14rem] md:p-5"
  >
    <div data-skeleton-region="header" class="flex min-w-0 flex-col gap-3">
      <div class="flex min-w-0 items-center gap-3 sm:gap-5">
        <SkeletonBlock class="size-8 shrink-0 sm:size-24" round />
        <div class="flex min-w-0 flex-col gap-2">
          <SkeletonBlock class="h-7 w-24" pill />
          <SkeletonBlock class="h-6 w-64" />
        </div>
      </div>
    </div>
    <div data-skeleton-region="rating" class="flex flex-col">
      <div data-testid="rating-box" :class="RATING_BOX_CLASSES">
        <SkeletonBlock class="h-5 w-16" />
        <SkeletonBlock class="h-9 w-24" />
        <SkeletonBlock class="h-10 w-56" />
      </div>
    </div>
  </Card>
  <div data-skeleton-region="tabs" class="flex gap-2 overflow-hidden">
    <SkeletonBlock v-for="index in TAB_COUNT" :key="index" class="min-h-11 w-28 shrink-0" pill />
  </div>
</template>
