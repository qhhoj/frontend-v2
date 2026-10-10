<script setup lang="ts">
import type { ViewerStatus } from '@/api/types/problems';

/** Filled check = solved, half-filled circle = attempted, empty ring = not tried. The label names it for screen readers. */
defineProps<{ status: ViewerStatus }>();
</script>

<template>
  <svg
    v-if="status === 'solved'"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    role="img"
    :aria-label="$t('problems.solved')"
    class="text-positive"
  >
    <circle cx="9" cy="9" r="8" fill="currentColor" />
    <path
      d="M5.2 9.3l2.4 2.4 5-5"
      stroke="var(--qh-surface-solid)"
      stroke-width="1.8"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
  <svg
    v-else-if="status === 'attempted'"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    role="img"
    :aria-label="$t('problems.attemptedLong')"
    class="text-verdict-tle"
  >
    <circle cx="9" cy="9" r="7.2" stroke="currentColor" stroke-width="1.6" fill="none" />
    <path d="M9 1.8a7.2 7.2 0 0 1 0 14.4z" fill="currentColor" />
  </svg>
  <svg
    v-else
    width="18"
    height="18"
    viewBox="0 0 18 18"
    role="img"
    :aria-label="$t('problems.notTried')"
    class="text-line-strong"
  >
    <circle cx="9" cy="9" r="7.2" stroke="currentColor" stroke-width="1.6" fill="none" />
  </svg>
</template>
