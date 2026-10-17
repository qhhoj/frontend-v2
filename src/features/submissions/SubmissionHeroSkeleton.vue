<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionHero.vue`: the same card, ring, two lines and the action buttons. */
</script>

<template>
  <Card as="div" class="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-card p-5 sm:px-6">
    <SkeletonBlock data-skeleton-region="ring" round class="size-18 shrink-0" />
    <div class="min-w-0 flex-1 basis-40">
      <p data-skeleton-region="score" class="flex min-h-7 items-center gap-3">
        <SkeletonBlock text class="w-28" />
        <SkeletonBlock text class="w-20" />
      </p>
      <p data-skeleton-region="line" class="mt-1.5 text-meta">
        <SkeletonBlock text class="w-56" />
      </p>
    </div>
    <div data-skeleton-region="actions" class="flex gap-2 sm:ml-auto">
      <SkeletonBlock class="h-11 w-28 rounded-control" />
    </div>
  </Card>
</template>
