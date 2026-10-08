<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <!-- Shaped like `AuthSelect` and `SchoolPicker`: the label line, then the 48 px field. -->
  <div data-skeleton-region="select" class="flex flex-col gap-1.5">
    <span class="text-sm font-semibold"><SkeletonBlock text class="w-32" /></span>
    <SkeletonBlock class="h-12 w-full rounded-row" />
  </div>
</template>
