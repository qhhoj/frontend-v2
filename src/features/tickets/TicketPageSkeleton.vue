<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** The ticket page's shape while it loads: the header card, three message cards, the side card. Each block mirrors the loaded markup's size. */
const MESSAGE_ROWS = [0, 1, 2];
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
    <div class="flex min-w-0 flex-col gap-5">
      <GlassCard
        as="div"
        data-skeleton-region="ticket-header"
        class="flex flex-col gap-3 p-5 sm:p-6"
      >
        <p class="text-[13px]"><SkeletonBlock text class="w-32" /></p>
        <div class="flex flex-wrap items-center gap-2">
          <SkeletonBlock pill class="h-6 w-24" />
        </div>
        <p class="page-title">
          <SkeletonBlock text class="w-3/4" />
        </p>
        <p class="text-sm"><SkeletonBlock text class="w-40" /></p>
        <!-- The meta line runs to a second line on a phone and stays on one from sm up, as the loaded line does. -->
        <div class="text-[13px]">
          <SkeletonBlock text class="w-full" />
          <span class="sm:hidden"> <SkeletonBlock text class="w-1/2" /></span>
        </div>
      </GlassCard>
      <section class="flex flex-col gap-4">
        <p data-skeleton-region="thread-counts" class="text-[13px]">
          <SkeletonBlock text class="w-40" />
        </p>
        <div
          v-for="row in MESSAGE_ROWS"
          :key="row"
          data-skeleton-region="message"
          class="flex gap-3 rounded-card border border-line bg-surface p-4"
        >
          <SkeletonBlock round class="size-8" />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="text-sm">
              <SkeletonBlock text class="w-1/3" />
            </div>
            <div class="user-content">
              <p><SkeletonBlock text class="w-full" /></p>
            </div>
          </div>
        </div>
      </section>
    </div>
    <GlassCard as="aside" data-skeleton-region="ticket-side" class="p-5">
      <SkeletonBlock class="h-40 w-full" />
    </GlassCard>
  </div>
</template>
