<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionHero.vue`: the same card, ring, score block, Bit slot and the action buttons. */
</script>

<template>
  <Card as="div" class="min-w-0 rounded-card">
    <div class="flex flex-wrap items-center gap-x-6 gap-y-4 p-6 sm:p-8">
      <SkeletonBlock data-skeleton-region="ring" round class="size-32 shrink-0" />
      <div class="min-w-0 flex-1 basis-40">
        <p data-skeleton-region="line" class="flex min-h-7 items-center text-sm">
          <SkeletonBlock text class="w-32" />
        </p>
        <p data-skeleton-region="score" class="mt-1 font-mono text-score leading-none">
          <SkeletonBlock class="h-14 w-40" />
        </p>
      </div>
      <SkeletonBlock data-skeleton-region="bit" class="ml-auto size-16 shrink-0 sm:size-24" />
      <div data-skeleton-region="actions" class="flex w-full gap-2">
        <SkeletonBlock class="h-11 w-28 rounded-control" />
      </div>
    </div>
  </Card>
</template>
