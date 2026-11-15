<script setup lang="ts">
/**
 * A score or a cell's text. When `animate` is on and the text changes, the old text slides up and out and the new text
 * slides up from below (`--ease-move`, `--qh-duration`: instant under reduced motion). The text is always the exact
 * current value; there are no numbers in between. With `animate` off, the text is swapped at once (first load, search).
 */
defineProps<{ text: string; animate?: boolean }>();
</script>

<template>
  <span class="inline-grid overflow-hidden align-top">
    <Transition
      :css="animate"
      enter-active-class="transition-[translate,opacity] duration-(--qh-duration) ease-move"
      leave-active-class="transition-[translate,opacity] duration-(--qh-duration) ease-move"
      enter-from-class="translate-y-full opacity-0"
      leave-to-class="-translate-y-full opacity-0"
    >
      <span :key="text" class="col-start-1 row-start-1">{{ text }}</span>
    </Transition>
  </span>
</template>
