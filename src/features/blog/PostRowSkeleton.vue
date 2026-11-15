<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same box as PostRow: a title line and a meta line at the left, the vote (44 px tall on a phone) at the end.
</script>

<template>
  <article data-skeleton-region="post-row" class="flex items-center gap-3 px-4 py-2.5 sm:px-5">
    <div data-part="body" class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div data-part="title" class="flex h-6 items-center">
        <SkeletonBlock pill class="h-4 w-3/4" />
      </div>
      <div data-part="meta" class="flex h-4 items-center">
        <SkeletonBlock pill class="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonBlock data-part="vote" pill class="h-11 w-28 shrink-0 sm:h-8 sm:w-24" />
  </article>
</template>
