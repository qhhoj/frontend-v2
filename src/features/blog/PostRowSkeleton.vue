<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same box as PostRow: a title line over a meta line on the left, the row vote (44 px tall) on the right.
</script>

<template>
  <article
    data-skeleton-region="post-row"
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2 sm:px-5"
  >
    <div data-part="body" class="flex min-w-0 flex-col gap-0.5">
      <div data-part="title" class="flex h-6 items-center">
        <SkeletonBlock pill class="h-4 w-3/4" />
      </div>
      <div data-part="meta" class="flex h-5 items-center">
        <SkeletonBlock pill class="h-3.5 w-1/2" />
      </div>
    </div>
    <SkeletonBlock data-part="vote" pill class="h-11 w-28" />
  </article>
</template>
