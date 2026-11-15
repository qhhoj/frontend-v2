<script setup lang="ts">
/**
 * The panel half of every fold: it opens and closes with a height change (grid rows 0fr to 1fr), the content stays in the DOM, and
 * while closed it is `invisible` and `inert` so it leaves the tab order and the accessibility tree. The trigger stays with the caller
 * (`Disclosure`, the test rows, the rules card, folded comments). Under reduced motion --qh-duration is 0, so the change is instant.
 * Inside a table, put it in the detail cell, never on the `<tr>`.
 */
defineProps<{ open: boolean }>();
defineOptions({ name: 'UiFoldPanel' });
</script>

<template>
  <div
    class="grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-(--qh-duration) ease-move"
    :class="open ? 'grid-rows-[1fr] visible' : 'invisible'"
    :inert="!open"
  >
    <div class="min-h-0 overflow-hidden"><slot /></div>
  </div>
</template>
