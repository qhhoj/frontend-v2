<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionHero.vue`: the same strip, ring, verdict and score, meta line and the action button. */
</script>

<template>
  <Card as="div" class="@container min-w-0 rounded-card">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
      <SkeletonBlock data-skeleton-region="ring" round class="size-10 shrink-0" />
      <div class="min-w-0 flex-1 @xl:flex-none">
        <p data-skeleton-region="line" class="flex min-h-6 items-center text-sm">
          <SkeletonBlock text class="w-24" />
        </p>
        <p data-skeleton-region="score" class="font-mono text-stat leading-none">
          <SkeletonBlock class="h-7 w-24" />
        </p>
      </div>
      <div class="order-1 min-w-0 basis-full @xl:order-none @xl:flex-1 @xl:basis-60">
        <SkeletonBlock data-skeleton-region="facts" text class="w-64 max-w-full" />
      </div>
      <div
        data-skeleton-region="actions"
        class="order-3 flex w-full gap-2 @xl:order-none @xl:w-auto"
      >
        <SkeletonBlock class="h-11 w-28 rounded-control" />
      </div>
    </div>
  </Card>
</template>
