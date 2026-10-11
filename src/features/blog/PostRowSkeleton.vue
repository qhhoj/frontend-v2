<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same box as PostRow: a title line, two excerpt lines and a meta line on the left, the row vote (44 px tall) on the right.
</script>

<template>
  <article
    data-skeleton-region="post-row"
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-4 sm:px-5 sm:py-5"
  >
    <div data-part="body" class="flex min-w-0 flex-col gap-2">
      <div data-part="title" class="flex h-7 items-center">
        <SkeletonBlock pill class="h-4 w-3/4" />
      </div>
      <div data-part="excerpt" class="flex flex-col gap-2 py-1">
        <SkeletonBlock pill class="h-3.5 w-full" />
        <SkeletonBlock pill class="h-3.5 w-2/3" />
      </div>
      <div data-part="meta" class="flex h-5 items-center">
        <SkeletonBlock pill class="h-3.5 w-1/2" />
      </div>
    </div>
    <SkeletonBlock data-part="vote" pill class="h-11 w-28" />
  </article>
</template>
