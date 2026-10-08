<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <!-- Mirrors OrganizationCard: the bordered join chip makes its row 30 px tall, the badge 28 px. -->
  <div data-skeleton-region="organization-card" class="glass flex flex-col gap-3 rounded-card p-5">
    <div class="flex flex-wrap items-center gap-2">
      <SkeletonBlock pill class="h-7 w-16" />
      <SkeletonBlock pill class="h-[30px] w-32" />
    </div>
    <div class="font-display text-lg font-semibold"><SkeletonBlock text class="w-2/3" /></div>
    <p class="flex min-h-5 gap-4 text-sm">
      <SkeletonBlock text class="w-28" />
      <SkeletonBlock text class="w-20" />
    </p>
  </div>
</template>
