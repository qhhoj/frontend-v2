<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** The problems tab while the contest loads: the table's head and a few rows (the header and the tabs are the layout's). */
const ROWS = 5;
</script>

<template>
  <div data-skeleton-region="problems" class="flex flex-col">
    <div v-for="row in ROWS" :key="row" class="border-b border-line py-3">
      <SkeletonBlock text class="w-full" />
    </div>
  </div>
</template>
