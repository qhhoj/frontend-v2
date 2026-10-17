<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';

const session = useSessionStore();
/** Signed-in viewers get the short-link button under the countdown. */
const hasActionRow = computed(() => session.status === 'authenticated');
</script>

<template>
  <SkeletonBlock data-skeleton-region="tabs" pill class="h-[52px] w-96 max-w-full" />
  <Card
    as="div"
    data-skeleton-region="contest-header"
    class="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:p-6"
  >
    <!-- Line boxes mirror ContestHeaderCard: the authors line shows from md up only. -->
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <SkeletonBlock pill class="h-7 w-48" />
        <!-- The phone chips row wraps to a second line. -->
        <SkeletonBlock pill class="h-6 w-28 sm:hidden" />
      </div>
      <div>
        <div class="font-display text-2xl leading-tight font-bold md:text-4xl">
          <SkeletonBlock text class="w-3/4" />
        </div>
        <p class="mt-1 hidden items-center gap-1.5 text-sm md:flex">
          <SkeletonBlock class="size-6 shrink-0" />
          <SkeletonBlock text class="w-48" />
        </p>
      </div>
      <!-- The bar, its two end labels, then the length line. -->
      <div class="flex flex-col gap-1.5">
        <SkeletonBlock class="h-2 w-full" />
        <p class="text-caption"><SkeletonBlock text class="w-full" /></p>
      </div>
      <p class="text-sm"><SkeletonBlock text class="w-80 max-w-full" /></p>
    </div>
    <div class="flex flex-col gap-4">
      <div data-skeleton-region="countdown" class="flex items-center gap-3">
        <!-- The stopwatch Bit box: 32 rows of 3 px on a phone; from md up a running contest's notice-size Bit and timer (98 px), an upcoming contest's 4 px Bit is 30 px taller. -->
        <SkeletonBlock round class="size-24 shrink-0 md:size-[98px]" />
        <div class="flex min-w-0 flex-1 flex-col">
          <p class="text-caption"><SkeletonBlock text class="w-20" /></p>
          <p class="font-mono text-3xl leading-tight md:text-5xl">
            <SkeletonBlock text class="w-48" />
          </p>
        </div>
      </div>
      <!-- ContestActions, then the short-link row. -->
      <SkeletonBlock pill class="h-11 w-full" />
      <SkeletonBlock v-if="hasActionRow" pill class="h-11 w-full" />
    </div>
  </Card>
  <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
    <Card as="div" data-skeleton-region="problems" class="flex flex-col px-5">
      <div v-for="row in 3" :key="row" class="py-3">
        <SkeletonBlock text class="w-full" />
      </div>
    </Card>
    <aside class="flex flex-col gap-5">
      <Card as="div" data-skeleton-region="rules" class="p-5">
        <dl class="flex flex-col gap-2.5 text-sm">
          <div v-for="row in 6" :key="row" class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
            <dt><SkeletonBlock text class="w-20" /></dt>
            <dd><SkeletonBlock text class="w-full" /></dd>
          </div>
        </dl>
      </Card>
    </aside>
  </div>
</template>
