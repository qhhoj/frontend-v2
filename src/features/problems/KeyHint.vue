<script setup lang="ts">
/** A keyboard shortcut printed inside a button; shown only with a fine pointer and only
 * when the submit bar (container `bar`) is wide enough to keep it on one row. */
defineProps<{ keys: string }>();
</script>

<template>
  <kbd
    aria-hidden="true"
    class="ml-2 hidden rounded-row border border-current px-1.5 font-mono text-caption leading-4 no-touch:@min-[30rem]/bar:inline"
    >{{ keys }}</kbd
  >
</template>
