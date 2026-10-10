<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';

/** Mirrors the rail's cards (submit, facts, links; "my submissions" for a signed-in viewer): keep their box sizes in sync. */
const FACT_COUNT = 5;
const session = useSessionStore();
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <GlassCard class="flex flex-col gap-3 rounded-panel p-4">
      <SkeletonBlock class="h-12 w-full" />
      <SkeletonBlock pill class="h-11 w-full" />
    </GlassCard>
    <GlassCard class="rounded-panel p-4">
      <div data-skeleton-region="limits" class="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <div v-for="fact in FACT_COUNT" :key="fact" data-skeleton-region="limit">
          <SkeletonBlock text class="w-16 text-[13px]" />
          <SkeletonBlock text class="mt-0.5 w-12 text-[17px]" />
        </div>
      </div>
    </GlassCard>
    <GlassCard
      v-if="session.status === 'authenticated'"
      class="flex flex-col gap-2 rounded-panel p-4"
    >
      <SkeletonBlock v-for="row in 3" :key="row" class="h-11" />
    </GlassCard>
    <GlassCard class="rounded-panel p-2"><SkeletonBlock class="h-11 w-full" /></GlassCard>
  </div>
</template>
