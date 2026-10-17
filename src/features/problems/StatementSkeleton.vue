<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import ProblemHeaderSkeleton from './ProblemHeaderSkeleton.vue';

/** Three paragraphs of three lines in the statement's text size; the editorial reuses it. */
const PARAGRAPHS = 3;
const LINES = 3;
/** `header` adds the problem header on top: the problem page's statement card is merged with it; `stripClass` is the layout's. */
defineProps<{ header?: boolean; stripClass?: string }>();
</script>

<template>
  <Card as="div" data-testid="statement-card" class="rounded-panel p-6 sm:p-8">
    <ProblemHeaderSkeleton v-if="header" :strip-class="stripClass ?? 'lg:hidden'" class="mb-4" />
    <div data-skeleton-region="statement" class="flex flex-col gap-4 text-sm leading-[1.75]">
      <p v-for="paragraph in PARAGRAPHS" :key="paragraph">
        <template v-for="line in LINES" :key="line">
          <SkeletonBlock text class="w-full" /><br />
        </template>
      </p>
    </div>
  </Card>
</template>
