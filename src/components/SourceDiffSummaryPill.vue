<script setup lang="ts">
/** Full label from `sm` up; a short one on phones (board M6CPhone), with the full text kept for screen readers. */
defineProps<{ full: string; short: string }>();
</script>

<template>
  <span data-full class="hidden sm:inline">{{ full }}</span>
  <span class="sm:hidden" aria-hidden="true">{{ short }}</span>
  <span class="sr-only sm:hidden">{{ full }}</span>
</template>
