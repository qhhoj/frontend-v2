<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same box as PostRow: a title line, two excerpt lines, then the meta line with the row vote (44 px tall) at its end.
</script>

<template>
  <article data-skeleton-region="post-row" class="px-4 py-4 sm:px-5 sm:py-5">
    <div data-part="body" class="flex min-w-0 flex-col gap-2">
      <div data-part="title" class="flex h-7 items-center">
        <SkeletonBlock pill class="h-4 w-3/4" />
      </div>
      <div data-part="excerpt" class="flex flex-col gap-2 py-1">
        <SkeletonBlock pill class="h-3.5 w-full" />
        <SkeletonBlock pill class="h-3.5 w-2/3" />
      </div>
      <div data-part="meta" class="flex items-center justify-between gap-3">
        <SkeletonBlock pill class="h-3.5 w-1/2" />
        <SkeletonBlock data-part="vote" pill class="h-11 w-28" />
      </div>
    </div>
  </article>
</template>
