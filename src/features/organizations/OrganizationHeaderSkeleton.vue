<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
  <section
    class="glass flex flex-col gap-5 rounded-card p-5 sm:p-7 md:flex-row md:items-start md:justify-between"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <SkeletonBlock pill class="h-7 w-16" />
        <SkeletonBlock pill class="h-7 w-32" />
      </div>
      <div class="font-display text-3xl font-bold"><SkeletonBlock text class="w-3/5" /></div>
      <p><SkeletonBlock text class="w-48" /></p>
      <p><SkeletonBlock text class="w-40" /></p>
    </div>
    <!-- Task 10 adds the membership panel's reserve back when it builds the real panel. -->
  </section>
</template>
