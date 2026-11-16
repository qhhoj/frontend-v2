<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

/**
 * One row of a public list on a phone (below `sm`), where the desktop table would scroll sideways. A list is a `<ul>`
 * of these inside one card: an optional `lead` column (solved mark, rank), the title on up to two lines with a `meta` line
 * under it (a `FactLine`, which wraps between facts), and a `trail` column on the right (points, a small button). The title link covers the whole row; a control in `trail`
 * takes `relative` to stay clickable above it.
 */
defineProps<{ to: RouteLocationRaw; title: string }>();
</script>

<template>
  <li
    class="relative flex min-h-11 items-center gap-3 border-line px-4 py-3 not-first:border-t hover:bg-surface-hover"
  >
    <span v-if="$slots.lead" class="flex w-5 shrink-0 justify-center self-start pt-0.5">
      <slot name="lead" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <RouterLink
        :to="to"
        class="line-clamp-2 text-sm font-semibold text-content after:absolute after:inset-0 hover:text-accent-text"
        >{{ title }}</RouterLink
      >
      <span v-if="$slots.meta" class="text-caption text-muted">
        <slot name="meta" />
      </span>
    </span>
    <span v-if="$slots.trail" class="flex shrink-0 flex-col items-end gap-0.5">
      <slot name="trail" />
    </span>
  </li>
</template>
