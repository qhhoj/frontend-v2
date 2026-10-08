<script setup lang="ts">
defineProps<{ contestKey: string; contestName: string; labelKey: string; isPrimary: boolean }>();
const BASE = 'inline-flex min-h-11 items-center rounded-pill font-semibold';
const PRIMARY = 'bg-gradient-accent px-5 text-on-accent';
const SECONDARY = 'border border-line px-4 hover:bg-surface-hover';
</script>

<template>
  <RouterLink
    :to="{ name: 'contest', params: { key: contestKey } }"
    :class="[BASE, isPrimary ? PRIMARY : SECONDARY]"
    >{{ $t(labelKey) }}<span class="sr-only">: {{ contestName }}</span></RouterLink
  >
</template>
