<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** The card list while its first page loads: the same card frame, ring and lines, so nothing jumps when rows arrive. */
const CARDS = 6;
</script>

<template>
  <ul class="m-0 flex list-none flex-col gap-2.5 p-0" aria-hidden="true">
    <li
      v-for="index in CARDS"
      :key="index"
      class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-row border border-line bg-surface-solid px-4 py-3.5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-5"
    >
      <SkeletonBlock round class="size-14" />
      <span class="flex min-w-0 flex-col gap-2">
        <SkeletonBlock class="h-4 w-3/5" />
        <SkeletonBlock class="h-3.5 w-2/5" />
        <SkeletonBlock class="h-4 w-full" />
      </span>
      <SkeletonBlock pill class="col-span-2 h-7 w-40 md:col-span-1" />
    </li>
  </ul>
</template>
