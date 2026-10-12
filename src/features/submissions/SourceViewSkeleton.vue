<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors the code area of `SourceView.vue`: keep its box, font and line height in sync. */
const LINE_COUNT = 10;
/** Code lines are not equally long. */
const LINE_WIDTHS = ['w-1/3', 'w-1/2', 'w-2/5', 'w-3/5', 'w-1/4'] as const;
</script>

<template>
  <div class="bg-surface-strong py-4 font-mono text-meta leading-relaxed">
    <div v-for="line in LINE_COUNT" :key="line" data-skeleton-region="source-line" class="px-4">
      <SkeletonBlock text :class="LINE_WIDTHS[line % LINE_WIDTHS.length]" />
    </div>
  </div>
</template>
