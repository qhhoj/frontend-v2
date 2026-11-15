<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <li
    data-skeleton-region="notification-row"
    class="flex items-start gap-3 border-t border-line py-2 first:border-t-0"
  >
    <SkeletonBlock class="size-8 shrink-0" />
    <span class="flex min-h-9 min-w-0 flex-1 flex-col gap-0.5 touch:min-h-11 px-1">
      <span class="block"><SkeletonBlock text class="w-3/4" /></span>
      <span class="text-sm"><SkeletonBlock text class="w-full" /></span>
      <span class="text-caption leading-4"><SkeletonBlock text class="w-16" /></span>
    </span>
    <SkeletonBlock round class="size-9 shrink-0 touch:size-11" />
  </li>
</template>
