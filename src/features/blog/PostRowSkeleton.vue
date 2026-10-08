<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <article class="flex gap-3 px-4 py-4 sm:px-5" data-skeleton-region="post-row">
    <div class="flex w-11 shrink-0 flex-col items-center gap-2 pt-1">
      <SkeletonBlock round class="size-11" />
      <SkeletonBlock class="h-4 w-6" />
      <SkeletonBlock round class="size-11" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-2.5">
      <SkeletonBlock pill class="h-6 w-3/4" />
      <SkeletonBlock pill class="h-4 w-full" />
      <SkeletonBlock pill class="h-4 w-11/12" />
      <SkeletonBlock pill class="h-4 w-2/3" />
      <SkeletonBlock pill class="h-4 w-1/2" />
    </div>
  </article>
</template>
