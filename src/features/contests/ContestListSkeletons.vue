<script setup lang="ts">
import type { ContestPhase } from '@/api/types/contests';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

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
      <p class="font-mono text-[13px]"><SkeletonBlock text class="w-24" /></p>
      <SkeletonBlock class="h-2 w-full" />
      <p class="font-semibold"><SkeletonBlock text class="w-40" /></p>
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm"><SkeletonBlock text class="w-28" /></p>
        <SkeletonBlock pill class="h-11 w-28" />
      </div>
    </div>
  </div>
</template>
