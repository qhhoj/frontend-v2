<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <!-- Mirrors OrganizationCard row for row: logo/name row, counts, footer with the chip and the action. -->
  <Card
    as="div"
    data-skeleton-region="organization-card"
    padding="md"
    class="flex flex-col gap-3.5"
  >
    <div class="flex items-center gap-3">
      <SkeletonBlock class="size-12 shrink-0" />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="font-bold"><SkeletonBlock text class="w-2/3" /></div>
        <div class="text-xs"><SkeletonBlock text class="w-16" /></div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <SkeletonBlock class="h-[42px] w-20" />
      <SkeletonBlock class="h-[42px] w-24" />
    </div>
    <div class="flex items-center justify-between gap-2 border-t border-line pt-3">
      <SkeletonBlock pill class="h-[30px] w-24" />
      <SkeletonBlock pill class="h-9 w-24" />
    </div>
  </Card>
</template>
