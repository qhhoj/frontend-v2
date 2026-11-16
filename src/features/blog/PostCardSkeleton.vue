<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same box as PostCard: a 144 px image area, then the label, a title, a 2-line excerpt and the meta line.
</script>

<template>
  <Card as="article" data-skeleton-region="post-card" class="flex flex-col overflow-hidden">
    <SkeletonBlock class="h-36 w-full rounded-none" />
    <div class="flex flex-col gap-2 p-4 sm:px-5">
      <SkeletonBlock pill class="h-4 w-16" />
      <SkeletonBlock pill class="h-6 w-3/4" />
      <div class="flex min-h-12 flex-col gap-1.5">
        <SkeletonBlock pill class="h-4 w-full" />
        <SkeletonBlock pill class="h-4 w-2/3" />
      </div>
      <SkeletonBlock pill class="mt-1 h-11 w-full" />
    </div>
  </Card>
</template>
