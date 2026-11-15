<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <!-- Mirrors the organizations table: one 32 px line per row (two short lines on a phone). -->
  <Card as="div" data-skeleton-region="organization-table" padding="sm" class="flex flex-col">
    <div
      v-for="row in 8"
      :key="row"
      class="flex min-h-11 items-center gap-3 border-line px-2 not-first:border-t"
    >
      <SkeletonBlock class="size-7 shrink-0" />
      <SkeletonBlock text class="w-1/2" />
      <SkeletonBlock pill class="ml-auto h-6 w-20" />
    </div>
  </Card>
</template>
