<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <section
    data-skeleton-region="organization-header"
    class="glass flex flex-col gap-5 rounded-card p-5 sm:p-7 md:flex-row md:items-start md:justify-between"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <SkeletonBlock pill class="h-7 w-16" />
        <SkeletonBlock pill class="h-[30px] w-32" />
        <span class="flex h-5 items-center text-sm">
          <SkeletonBlock text class="w-36" />
        </span>
      </div>
      <div class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        <SkeletonBlock text class="w-3/5" />
      </div>
      <p><SkeletonBlock text class="w-48" /></p>
      <p class="min-h-5 text-sm"><SkeletonBlock text class="w-40" /></p>
    </div>
    <!-- Reserves the membership panel's height and width: the signed-out panel is one 44 px button. -->
    <SkeletonBlock pill class="h-11 w-full md:w-72" />
  </section>
</template>
