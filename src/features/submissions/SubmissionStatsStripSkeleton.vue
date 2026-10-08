<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionStatsStrip.vue`: keep its grid, card and text classes in sync. */
const TILE_COUNT = 4;
</script>

<template>
  <div data-testid="stats-strip" class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
    <GlassCard
      v-for="tile in TILE_COUNT"
      :key="tile"
      as="div"
      data-skeleton-region="tile"
      class="p-5"
    >
      <div class="flex flex-col">
        <div data-skeleton-region="value" class="order-1 font-mono text-[30px] font-bold">
          <SkeletonBlock text class="w-24" />
        </div>
        <div data-skeleton-region="label" class="order-2 text-[13px]">
          <SkeletonBlock text class="w-32" />
        </div>
      </div>
    </GlassCard>
  </div>
</template>
