<script setup lang="ts">
import type { ContestPhase } from '@/api/types/contests';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import EndedContestSkeleton from './EndedContestSkeleton.vue';

defineProps<{ kind: ContestPhase }>();
</script>

<template>
  <div v-if="kind === 'running'" class="grid gap-4 lg:grid-cols-2">
    <div
      v-for="card in 2"
      :key="card"
      data-skeleton-region="running-card"
      class="glass flex flex-col gap-3 rounded-card p-5"
    >
      <SkeletonBlock pill class="h-7 w-40" />
      <div class="font-display text-xl font-semibold"><SkeletonBlock text class="w-3/4" /></div>
      <p class="font-mono text-meta"><SkeletonBlock text class="w-24" /></p>
      <SkeletonBlock class="h-2 w-full" />
      <p class="font-semibold"><SkeletonBlock text class="w-40" /></p>
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm"><SkeletonBlock text class="w-28" /></p>
        <SkeletonBlock pill class="h-11 w-28" />
      </div>
    </div>
  </div>
  <div v-else-if="kind === 'upcoming'" class="glass rounded-card">
    <div
      v-for="row in 3"
      :key="row"
      data-skeleton-region="upcoming-row"
      class="flex flex-wrap items-center gap-4 border-t border-line px-5 py-4 first:border-t-0"
    >
      <SkeletonBlock class="size-16 shrink-0 rounded-tile" />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="font-display text-lg font-semibold"><SkeletonBlock text class="w-2/3" /></div>
        <p class="text-sm"><SkeletonBlock text class="w-1/2" /></p>
        <div class="flex items-center gap-1.5">
          <SkeletonBlock pill class="h-6.5 w-24" />
          <SkeletonBlock text class="w-20" />
        </div>
      </div>
      <div class="flex flex-col gap-1.5 text-sm">
        <p class="font-mono"><SkeletonBlock text class="w-28" /></p>
        <p class="text-muted"><SkeletonBlock text class="w-40" /></p>
      </div>
      <SkeletonBlock pill class="h-11 w-36" />
    </div>
  </div>
  <EndedContestSkeleton v-else />
</template>
