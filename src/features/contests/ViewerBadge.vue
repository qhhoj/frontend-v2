<script setup lang="ts">
defineProps<{ badgeKey: string | null }>();
const TONE =
  'inline-flex min-h-6.5 items-center rounded-pill bg-accent-soft px-2.5 text-caption font-semibold whitespace-nowrap text-accent-soft-text';
</script>

<template>
  <span v-if="badgeKey" data-testid="viewer-badge" :class="TONE">{{ $t(badgeKey) }}</span>
</template>
