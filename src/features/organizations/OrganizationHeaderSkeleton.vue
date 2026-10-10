<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <section
    data-skeleton-region="organization-header"
    class="flex flex-col gap-5 md:flex-row md:items-center"
  >
    <SkeletonBlock class="size-[76px] shrink-0" />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="font-display text-3xl leading-tight"><SkeletonBlock text class="w-3/5" /></div>
      <p class="min-h-5 text-sm"><SkeletonBlock text class="w-3/4" /></p>
      <p class="min-h-5 text-sm"><SkeletonBlock text class="w-40" /></p>
    </div>
    <!-- Reserves the membership panel's height and width: the signed-out panel is one 44 px button. -->
    <SkeletonBlock pill class="h-11 w-full md:w-72" />
  </section>
</template>
