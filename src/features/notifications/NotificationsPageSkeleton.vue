<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import NotificationRowSkeleton from './NotificationRowSkeleton.vue';

/** Same wrappers as `NotificationList`: one day heading, then six rows. */
const PAGE_SKELETON_ROWS = 6;
</script>

<template>
  <div class="flex flex-col gap-4">
    <section data-skeleton-region="notification-day">
      <h2 class="text-caption leading-4 font-semibold tracking-wider text-muted uppercase">
        <SkeletonBlock text class="w-16" />
      </h2>
      <ul class="m-0 list-none p-0">
        <NotificationRowSkeleton v-for="index in PAGE_SKELETON_ROWS" :key="index" />
      </ul>
    </section>
  </div>
</template>
