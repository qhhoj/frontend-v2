<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import ProblemHeaderSkeleton from './ProblemHeaderSkeleton.vue';

/** Three paragraphs of three lines in the statement's text size; the editorial reuses it. */
const PARAGRAPHS = 3;
const LINES = 3;
/** `header` adds the problem header on top: the problem page's statement card is merged with it. */
defineProps<{ header?: boolean }>();
</script>

<template>
  <GlassCard as="div" data-testid="statement-card" class="rounded-panel p-6 sm:p-8">
    <ProblemHeaderSkeleton v-if="header" class="mb-4" />
    <div data-skeleton-region="statement" class="flex flex-col gap-4 text-[15px] leading-[1.75]">
      <p v-for="paragraph in PARAGRAPHS" :key="paragraph">
        <template v-for="line in LINES" :key="line">
          <SkeletonBlock text class="w-full" /><br />
        </template>
      </p>
    </div>
  </GlassCard>
</template>
