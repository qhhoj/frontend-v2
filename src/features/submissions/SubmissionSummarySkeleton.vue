<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { AUTHOR_FACT_KEY, SUMMARY_FACT_KEYS } from './summary-facts';

/** Mirrors `SubmissionSummary.vue`: keep its cards, grid and text classes in sync. */
/** The real line holds a `VerdictBadge` (h-7); the score is `text-[56px] leading-none`, so a block as tall (h-14). */
const BADGE_LINE_CLASS = 'min-h-7';
/** The verdict Bit's box in `SubmissionSummary.vue` (16 pixels of 4 px, 6 px from sm up), so the row wraps the same. */
const BIT_SLOT_CLASS = 'size-16 sm:size-24';
const SCORE_BLOCK_CLASS = 'h-14 w-40';
</script>

<template>
  <div
    data-testid="submission-summary"
    class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
  >
    <Card
      as="div"
      class="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-4 rounded-panel p-6 sm:p-8"
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
      <SkeletonBlock data-skeleton-region="bit" :class="BIT_SLOT_CLASS" class="ml-auto shrink-0" />
    </Card>
    <Card as="div" class="rounded-panel p-6 sm:p-8">
      <dl data-skeleton-region="facts" class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        <template v-for="key in SUMMARY_FACT_KEYS" :key="key">
          <dt data-skeleton-region="fact" class="text-meta">
            <SkeletonBlock text class="w-16" />
          </dt>
          <dd>
            <span v-if="key === AUTHOR_FACT_KEY" class="flex items-center gap-2.5">
              <SkeletonBlock class="size-8 shrink-0" />
              <SkeletonBlock text class="w-32" />
            </span>
            <SkeletonBlock v-else text class="w-32" />
          </dd>
        </template>
      </dl>
    </Card>
  </div>
</template>
