<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
// Same blocks as PostArticle: a two-line title at the h1 size, the byline row, then eight body lines of varied width.
const BODY_WIDTHS = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-10/12', 'w-3/4', 'w-1/2'];
</script>

<template>
  <article class="flex min-w-0 flex-col gap-5">
    <div data-skeleton-region="title" class="flex flex-col gap-2">
      <SkeletonBlock pill class="h-9 w-4/5 sm:h-10" />
      <SkeletonBlock pill class="h-9 w-3/5 sm:h-10" />
    </div>
    <div data-skeleton-region="byline" class="flex items-center gap-3">
      <SkeletonBlock round class="size-7" />
      <div class="flex flex-col gap-1.5">
        <SkeletonBlock pill class="h-3.5 w-28" />
        <SkeletonBlock pill class="h-3 w-20" />
      </div>
    </div>
    <div data-skeleton-region="body" class="flex flex-col gap-3">
      <SkeletonBlock
        v-for="(width, index) in BODY_WIDTHS"
        :key="index"
        pill
        class="h-4"
        :class="width"
      />
    </div>
  </article>
</template>
