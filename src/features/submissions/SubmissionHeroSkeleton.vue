<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionHero.vue`: the one strip with the verdict word, the score and the test line. */
</script>

<template>
  <div class="min-w-0 rounded-card bg-surface-strong">
    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 sm:px-6">
      <p data-skeleton-region="line" class="flex min-h-6 items-center text-title">
        <SkeletonBlock text class="w-24" />
      </p>
      <p data-skeleton-region="score" class="font-mono text-stat leading-none">
        <SkeletonBlock class="h-7 w-24" />
      </p>
      <SkeletonBlock data-skeleton-region="facts" text class="w-64 max-w-full" />
    </div>
  </div>
</template>
