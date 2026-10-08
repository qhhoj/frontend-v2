<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** The ticket page's shape while it loads: header lines, three message blocks, the side card. */
const MESSAGE_ROWS = [0, 1, 2];
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="flex min-w-0 flex-col gap-5">
      <div data-skeleton-region="ticket-header" class="flex flex-col gap-3">
        <SkeletonBlock class="h-4 w-40" />
        <SkeletonBlock class="h-9 w-3/4" />
        <SkeletonBlock class="h-4 w-1/2" />
      </div>
      <div v-for="row in MESSAGE_ROWS" :key="row" data-skeleton-region="message" class="flex gap-3">
        <SkeletonBlock round class="size-8" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <SkeletonBlock class="h-4 w-1/3" />
          <SkeletonBlock class="h-16 w-full" />
        </div>
      </div>
    </div>
    <GlassCard as="aside" data-skeleton-region="ticket-side" class="p-5">
      <SkeletonBlock class="h-40 w-full" />
    </GlassCard>
  </div>
</template>
