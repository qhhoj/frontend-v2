<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';

/** Mirrors the rail's cards (submit, facts: 5 limits + 2 file I/O cells, links; "my submissions" for a signed-in viewer): keep their box sizes in sync. */
const FACT_COUNT = 7;
const session = useSessionStore();
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <Card class="flex flex-col gap-3 p-4">
      <SkeletonBlock class="h-12 w-full" />
      <SkeletonBlock pill class="h-11 w-full" />
    </Card>
    <Card class="p-4">
      <div data-skeleton-region="limits" class="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <div v-for="fact in FACT_COUNT" :key="fact" data-skeleton-region="limit">
          <SkeletonBlock text class="w-16 text-meta" />
          <SkeletonBlock text class="mt-0.5 w-12 text-title" />
        </div>
      </div>
    </Card>
    <Card v-if="session.status === 'authenticated'" class="flex flex-col gap-2 p-4">
      <SkeletonBlock v-for="row in 3" :key="row" class="h-11" />
    </Card>
    <Card class="p-2"><SkeletonBlock class="h-11 w-full" /></Card>
  </div>
</template>
