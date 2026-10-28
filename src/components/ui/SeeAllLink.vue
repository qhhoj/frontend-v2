<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

/** The "see all" link of a card: always in the card header, right side, one style. */
defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink
    :to="to"
    class="-my-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent-text hover:underline"
  >
    <slot />
  </RouterLink>
</template>
