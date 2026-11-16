<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { AUTHOR_FACT_KEY, SUMMARY_FACT_KEYS } from './summary-facts';

/** Mirrors `SubmissionFacts.vue`: the same card and fact grid. */
</script>

<template>
  <Card as="div" class="rounded-card p-6 sm:p-8">
    <dl data-skeleton-region="facts" class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
      <template v-for="key in SUMMARY_FACT_KEYS" :key="key">
        <dt data-skeleton-region="fact" class="text-meta">
          <SkeletonBlock text class="w-16" />
        </dt>
        <dd>
          <span v-if="key === AUTHOR_FACT_KEY" class="flex items-center gap-2.5">
            <SkeletonBlock class="size-8 shrink-0" />
            <SkeletonBlock text class="w-28" />
          </span>
          <SkeletonBlock v-else text class="w-28" />
        </dd>
      </template>
    </dl>
  </Card>
</template>
