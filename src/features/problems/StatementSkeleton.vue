<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import ProblemHeaderSkeleton from './ProblemHeaderSkeleton.vue';

/** Three paragraphs of three lines in the statement's text size; the editorial reuses it. */
const PARAGRAPHS = 3;
const LINES = 3;
/** `header` adds the problem header on top, on the page background above the card. */
defineProps<{ header?: boolean }>();
/** Like the loaded statement card: no frame and no padding on a phone. */
const isPhone = useMediaQuery(PHONE_QUERY);
</script>

<template>
  <div class="min-w-0">
    <ProblemHeaderSkeleton v-if="header" />
    <Card
      as="div"
      data-testid="statement-card"
      :variant="isPhone ? 'plain' : 'glass'"
      :class="[isPhone ? '' : 'p-6 sm:p-8', header && 'mt-4']"
    >
      <div data-skeleton-region="statement" class="flex flex-col gap-4 text-sm leading-[1.75]">
        <p v-for="paragraph in PARAGRAPHS" :key="paragraph">
          <template v-for="line in LINES" :key="line">
            <SkeletonBlock text class="w-full" /><br />
          </template>
        </p>
      </div>
    </Card>
  </div>
</template>
