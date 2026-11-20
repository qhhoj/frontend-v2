<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

/** The text link of a section or card header ("Xem tất cả"): right side, brand text, underline on hover. One style. */
defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink
    :to="to"
    class="-my-3 inline-flex min-h-11 items-center text-meta font-semibold whitespace-nowrap text-accent-text underline-offset-2 hover:underline"
  >
    <slot />
  </RouterLink>
</template>
