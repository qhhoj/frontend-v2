<script setup lang="ts">
/** A keyboard shortcut printed inside a button; hidden where there is no keyboard (coarse pointers). */
defineProps<{ keys: string }>();
</script>

<template>
  <kbd
    aria-hidden="true"
    class="ml-2 hidden rounded-row border border-current px-1.5 font-mono text-caption leading-4 no-touch:inline"
    >{{ keys }}</kbd
  >
</template>
