<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same box as PostRow: the vote column is VoteControl's 116 px; the body is a 56 px title, a 72 px summary and a footer that is two 20 px lines on a phone (the meta wraps there) and one on wider screens.
</script>

<template>
  <article data-skeleton-region="post-row" class="flex gap-3 px-4 py-4 sm:px-5">
    <div data-part="vote" class="flex w-11 shrink-0 flex-col items-center gap-0.5">
      <SkeletonBlock round class="size-11" />
      <SkeletonBlock class="h-6 w-8" />
      <SkeletonBlock round class="size-11" />
    </div>
    <div data-part="body" class="flex min-w-0 flex-1 flex-col gap-2">
      <div data-part="title" class="h-14">
        <SkeletonBlock pill class="h-6 w-3/4" />
      </div>
      <div data-part="summary" class="flex h-18 flex-col gap-1.5">
        <SkeletonBlock pill class="h-4 w-full" />
        <SkeletonBlock pill class="h-4 w-11/12" />
        <SkeletonBlock pill class="h-4 w-2/3" />
      </div>
      <div data-part="footer" class="min-h-11 sm:min-h-5">
        <SkeletonBlock pill class="h-3.5 w-1/2" />
      </div>
    </div>
  </article>
</template>
