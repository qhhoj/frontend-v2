<script setup lang="ts">
/** One danger-zone action: a title, one line of consequence, its controls on the right (below on a phone), then its status. */
defineProps<{ title: string; text: string }>();
</script>

<template>
  <div class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-56">
        <h4 class="text-sm font-semibold">{{ title }}</h4>
        <p class="text-sm text-muted">{{ text }}</p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2"><slot /></div>
    </div>
    <slot name="body" />
    <slot name="status" />
  </div>
</template>
