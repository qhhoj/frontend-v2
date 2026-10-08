<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <div
    data-skeleton-region="contest-header"
    class="glass grid gap-5 rounded-card p-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:p-6"
  >
    <div class="flex flex-col gap-3">
      <SkeletonBlock pill class="h-7 w-48" />
      <div class="font-display text-2xl leading-tight font-bold md:text-4xl">
        <SkeletonBlock text class="w-3/4" />
      </div>
      <SkeletonBlock class="h-2 w-full" />
      <p class="hidden text-sm md:block"><SkeletonBlock text class="w-80" /></p>
    </div>
    <div data-skeleton-region="countdown" class="flex flex-col gap-1">
      <p class="text-[12px]"><SkeletonBlock text class="w-20" /></p>
      <p class="font-mono text-3xl leading-tight md:text-5xl">
        <SkeletonBlock text class="w-48" />
      </p>
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
