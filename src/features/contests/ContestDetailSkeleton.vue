<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';

const session = useSessionStore();
/** Signed-in viewers get the short-link button under the countdown. */
const hasActionRow = computed(() => session.status === 'authenticated');
</script>

<template>
  <div
    data-skeleton-region="contest-header"
    class="glass grid gap-5 rounded-card p-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:p-6"
  >
    <!-- Line boxes mirror ContestHeaderCard: the phone line and the authors line each show at one width only. -->
    <div class="flex flex-col gap-3">
      <SkeletonBlock pill class="h-7 w-48" />
      <div>
        <div class="font-display text-2xl leading-tight font-bold md:text-4xl">
          <SkeletonBlock text class="w-3/4" />
        </div>
        <p class="font-mono text-[12px] md:hidden"><SkeletonBlock text class="w-48" /></p>
        <p class="mt-1 hidden items-center gap-1.5 text-sm md:flex">
          <SkeletonBlock class="size-6 shrink-0" />
          <SkeletonBlock text class="w-48" />
        </p>
      </div>
      <div class="flex flex-col gap-1.5">
        <p class="hidden h-5 md:block"><SkeletonBlock text class="w-full" /></p>
        <SkeletonBlock class="h-2 w-full" />
      </div>
      <p class="hidden text-sm md:block"><SkeletonBlock text class="w-80" /></p>
    </div>
    <div class="flex flex-col gap-4">
      <div data-skeleton-region="countdown" class="flex items-center gap-4">
        <!-- The stopwatch Bit box: 32 rows of 3 px on a phone; from md up a running contest's notice-size Bit and timer (98 px), an upcoming contest's 4 px Bit is 30 px taller. -->
        <SkeletonBlock round class="size-24 shrink-0 md:size-[98px]" />
        <div class="flex min-w-0 flex-1 flex-col">
          <p class="text-[12px]"><SkeletonBlock text class="w-20" /></p>
          <p class="font-mono text-3xl leading-tight md:text-5xl">
            <SkeletonBlock text class="w-48" />
          </p>
          <p class="text-sm"><SkeletonBlock text class="w-40" /></p>
        </div>
      </div>
      <!-- ContestActions is static from md (below md it is a fixed bar and takes no row), then the short-link row. -->
      <SkeletonBlock pill class="hidden h-11 w-full md:block" />
      <SkeletonBlock v-if="hasActionRow" pill class="h-11 w-full" />
    </div>
  </div>
  <SkeletonBlock data-skeleton-region="tabs" pill class="h-[52px] w-96 max-w-full" />
  <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
    <div data-skeleton-region="problems" class="glass flex flex-col rounded-card px-5">
      <div v-for="row in 3" :key="row" class="py-3">
        <SkeletonBlock text class="w-full" />
      </div>
    </div>
    <aside class="flex flex-col gap-5">
      <div data-skeleton-region="rules" class="glass rounded-card p-5">
        <dl class="flex flex-col gap-2.5 text-sm">
          <div v-for="row in 6" :key="row" class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
            <dt><SkeletonBlock text class="w-20" /></dt>
            <dd><SkeletonBlock text class="w-full" /></dd>
          </div>
        </dl>
      </div>
    </aside>
  </div>
</template>
