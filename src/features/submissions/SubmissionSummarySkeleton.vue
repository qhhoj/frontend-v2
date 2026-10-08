<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmissionSummary.vue`: keep its cards, grid and text classes in sync. */
const FACT_COUNT = 6;
/** The real line holds a `VerdictBadge` (h-7); the score is `text-[56px] leading-none`, so a block as tall (h-14). */
const BADGE_LINE_CLASS = 'min-h-7';
const SCORE_BLOCK_CLASS = 'h-14 w-40';
</script>

<template>
  <div
    data-testid="submission-summary"
    class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
  >
    <GlassCard
      as="div"
      class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-panel p-6 sm:p-8"
    >
      <SkeletonBlock data-skeleton-region="ring" round class="size-32 shrink-0" />
      <div class="min-w-0 flex-1 basis-40">
        <p data-skeleton-region="line" :class="BADGE_LINE_CLASS" class="flex items-center text-sm">
          <SkeletonBlock text class="w-32" />
        </p>
        <p data-skeleton-region="score" class="mt-1 font-mono text-[56px] leading-none">
          <SkeletonBlock :class="SCORE_BLOCK_CLASS" />
        </p>
      </div>
    </GlassCard>
    <GlassCard as="div" class="rounded-panel p-6 sm:p-8">
      <dl
        data-skeleton-region="facts"
        class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[15px]"
      >
        <template v-for="fact in FACT_COUNT" :key="fact">
          <dt data-skeleton-region="fact" class="text-[13px]">
            <SkeletonBlock text class="w-16" />
          </dt>
          <dd><SkeletonBlock text class="w-32" /></dd>
        </template>
      </dl>
    </GlassCard>
  </div>
</template>
