<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SourceDiff.vue`: the same card, summary row (three pills, short on a phone) and line font, so nothing jumps when the rows arrive. */
const LINE_COUNT = 12;
const LINE_WIDTHS = ['w-1/3', 'w-1/2', 'w-2/5', 'w-3/5', 'w-1/4'] as const;
</script>

<template>
  <GlassCard as="div" class="overflow-hidden rounded-panel">
    <div data-skeleton-region="diff-summary" class="flex flex-wrap gap-2 px-5 py-4 text-sm sm:px-6">
      <SkeletonBlock pill class="h-7 w-12 sm:w-20" />
      <SkeletonBlock pill class="h-7 w-12 sm:w-20" />
      <SkeletonBlock pill class="h-7 w-28 sm:w-36" />
    </div>
    <div class="bg-surface-strong font-mono text-meta leading-relaxed">
      <div
        v-for="line in LINE_COUNT"
        :key="line"
        data-skeleton-region="diff-line"
        class="grid grid-cols-2 gap-6 px-4"
      >
        <SkeletonBlock text :class="LINE_WIDTHS[line % LINE_WIDTHS.length]" />
        <SkeletonBlock text :class="LINE_WIDTHS[(line + 2) % LINE_WIDTHS.length]" />
      </div>
    </div>
  </GlassCard>
</template>
