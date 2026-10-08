<script setup lang="ts">
/**
 * A pulsing placeholder in `--qh-skeleton`. Set its width (and height) with classes; `text` makes it exactly 1em tall and inline,
 * so inside an element that carries the real text classes (font size, line height) the row is as tall as the loaded one.
 */
defineProps<{ text?: boolean; round?: boolean }>();
</script>

<template>
  <span
    aria-hidden="true"
    data-skeleton
    class="skeleton-pulse bg-skeleton"
    :class="[
      text ? 'inline-block h-[1em] align-middle' : 'block',
      round ? 'rounded-full' : 'rounded-skeleton',
    ]"
  />
</template>
