<script setup lang="ts">
/** The list's count ("214 đã giải · 1.483 bài"), at the right of the toolbar; read out politely when a filter changes it. */
defineProps<{ text: string }>();
</script>

<template>
  <p
    data-testid="problems-count"
    aria-live="polite"
    class="font-mono text-meta text-muted tabular-nums"
  >
    {{ text }}
  </p>
</template>
