<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `ProblemHeader.vue`: keep its boxes, text classes and grid in sync. */
const LIMIT_COUNT = 4;
</script>

<template>
  <GlassCard data-testid="problem-header" class="rounded-panel p-6 sm:p-8">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div class="min-w-0 flex-1">
        <p data-skeleton-region="meta" class="font-mono text-sm">
          <SkeletonBlock text class="w-40" />
        </p>
        <div
          data-skeleton-region="title"
          class="mt-1 font-display text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.15]"
        >
          <SkeletonBlock text class="w-3/4" />
          <!-- a phone title usually wraps to a second line -->
          <span class="sm:hidden"><br /><SkeletonBlock text class="w-1/2" /></span>
        </div>
        <div data-skeleton-region="chips" class="mt-3 flex min-h-8 flex-wrap items-center gap-2">
          <SkeletonBlock pill class="h-7 w-20" />
          <SkeletonBlock pill class="h-7 w-16" />
        </div>
      </div>
      <div class="flex min-h-11 shrink-0 items-center">
        <SkeletonBlock pill class="h-11 w-24" />
      </div>
    </div>
    <dl data-skeleton-region="limits" class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div v-for="limit in LIMIT_COUNT" :key="limit" data-skeleton-region="limit">
        <dt class="text-[13px]"><SkeletonBlock text class="w-16" /></dt>
        <dd class="font-mono text-2xl font-semibold"><SkeletonBlock text class="w-20" /></dd>
      </div>
    </dl>
  </GlassCard>
</template>
