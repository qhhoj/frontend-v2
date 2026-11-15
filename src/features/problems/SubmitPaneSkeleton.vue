<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Mirrors `SubmitPane.vue` beside the statement: the bar (language, upload, submit) over the editor; keep their boxes in sync. */
</script>

<template>
  <Card as="div" class="flex flex-col gap-3 p-3">
    <div class="flex items-center gap-3">
      <SkeletonBlock class="h-(--qh-control) w-44" />
      <SkeletonBlock class="h-(--qh-control) w-28" />
      <SkeletonBlock class="ml-auto h-(--qh-control) w-32" />
    </div>
    <SkeletonBlock class="min-h-60 flex-1" />
  </Card>
</template>
