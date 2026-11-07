<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

/**
 * The small mark after a tab or segment label. Shape, not only colour, tells the two apart: `accent` (unsaved edits) is
 * a filled dot, `danger` (something to fix) an alert icon. `label` is read by assistive tech and shown on hover.
 */
defineProps<{ tone: 'accent' | 'danger'; label: string }>();
</script>

<template>
  <span :title="label" class="inline-flex shrink-0 items-center align-middle">
    <CircleAlert v-if="tone === 'danger'" aria-hidden="true" class="size-3.5 text-negative" />
    <span v-else aria-hidden="true" class="size-2 rounded-full bg-accent" />
    <span class="sr-only">{{ label }}</span>
  </span>
</template>
