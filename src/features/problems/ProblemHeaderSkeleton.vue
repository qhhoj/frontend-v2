<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';

/** Mirrors `ProblemHeader.vue`: keep its boxes, text classes and grid in sync. */
const LIMIT_COUNT = 4;
const session = useSessionStore();
/** Signed-in viewers get the short-link button, which takes its own row below 640 px. */
const hasActionRow = computed(() => session.status === 'authenticated');
</script>

<template>
  <GlassCard data-testid="problem-header" class="rounded-panel p-6 sm:p-8">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div class="min-w-0 flex-1">
        <p data-skeleton-region="meta" class="font-mono text-sm">
          <SkeletonBlock text class="w-40" />
        </p>
        <div data-skeleton-region="title" class="mt-1 page-title">
          <SkeletonBlock text class="w-3/4" />
          <!-- a phone title reserves two lines -->
          <span class="sm:hidden"><br /><SkeletonBlock text class="w-1/2" /></span>
        </div>
        <div data-skeleton-region="chips" class="mt-3 flex min-h-8 flex-wrap items-center gap-2">
          <SkeletonBlock pill class="h-7 w-20" />
          <SkeletonBlock pill class="h-7 w-16" />
        </div>
      </div>
      <div class="flex min-h-11 shrink-0 items-center" :class="hasActionRow ? 'max-sm:w-full' : ''">
        <SkeletonBlock pill class="h-11 w-24" />
      </div>
    </div>
    <div data-skeleton-region="limits" class="mt-5 flex flex-wrap gap-2">
      <SkeletonBlock
        v-for="limit in LIMIT_COUNT"
        :key="limit"
        pill
        data-skeleton-region="limit"
        class="h-8 w-32"
      />
    </div>
  </GlassCard>
</template>
