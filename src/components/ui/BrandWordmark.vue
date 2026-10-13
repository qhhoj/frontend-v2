<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

/** The QHHOJ wordmark: Space Grotesk bold, the "O" in the accent colour (every theme brings its own); the `o` slot swaps that glyph (e.g. for Bit). One link, the one place the brand text is drawn. */
withDefaults(defineProps<{ to?: RouteLocationRaw; size?: 'sm' | 'md' | 'lg' }>(), {
  to: '/',
  size: 'md',
});
const SIZES = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl lg:text-3xl' } as const;
</script>

<template>
  <RouterLink
    :to="to"
    :aria-label="$t('app.name')"
    class="inline-flex min-h-11 shrink-0 items-center font-display leading-none font-bold tracking-tight whitespace-nowrap text-content"
    :class="SIZES[size]"
  >
    <span aria-hidden="true"
      >QHH<slot name="o"><span class="text-accent">O</span></slot
      >J</span
    >
  </RouterLink>
</template>
